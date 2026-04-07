import { GZ_LOOT_COMMAND } from "./discord/command";
import { InteractionResponseType, InteractionType, type DiscordInteraction } from "./discord/types";
import { verifyDiscordRequest } from "./discord/verify";
import { getLootItemByName, searchLootItems } from "./data/loot";

type Env = {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");
    const rawBody = await request.text();

    const isValidRequest = verifyDiscordRequest(rawBody, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValidRequest) {
      return new Response("Bad Request Signature", { status: 401 });
    }

    let interaction: DiscordInteraction;
    try {
      interaction = JSON.parse(rawBody) as DiscordInteraction;
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (interaction.type === InteractionType.PING) {
      return Response.json({ type: InteractionResponseType.PONG });
    }

    if (interaction.data?.name !== GZ_LOOT_COMMAND.name) {
      return new Response(null, { status: 204 });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
      const focusedValue = getFocusedOptionValue(interaction);
      const choices = searchLootItems(focusedValue, 25).map((item) => ({
        name: item.name,
        value: item.name,
      }));

      return Response.json({
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices },
      });
    }

    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const lootable = getOptionValue(interaction, "lootable");
      const lootItem = lootable ? getLootItemByName(lootable) : null;
      const userId = getInteractionUserId(interaction);

      if (!userId) {
        return new Response(null, { status: 204 });
      }

      if (!lootItem) {
        const notFoundMessage = "I could not find that loot item. Try using autocomplete from the command option.";
        await sendDirectMessage(userId, notFoundMessage, env.DISCORD_BOT_TOKEN);
        return new Response(null, { status: 204 });
      }

      const dmMessage = [
        `**${lootItem.name}**`,
        `Size: ${lootItem.size}`,
        `Weight: ${lootItem.weight}`,
        `Sell Price: ${formatPrice(lootItem.sellPrice)}`,
      ].join("\n");

      await sendDirectMessage(userId, dmMessage, env.DISCORD_BOT_TOKEN);
      return new Response(null, { status: 204 });
    }

    return Response.json({ error: "Unhandled interaction type" }, { status: 400 });
  },
};

function getFocusedOptionValue(interaction: DiscordInteraction): string {
  const focused = interaction.data?.options?.find((option) => option.focused);
  return typeof focused?.value === "string" ? focused.value : "";
}

function getOptionValue(interaction: DiscordInteraction, optionName: string): string | null {
  const option = interaction.data?.options?.find((candidate) => candidate.name === optionName);
  return typeof option?.value === "string" ? option.value : null;
}

function formatPrice(price: number | null): string {
  return price === null ? "Unknown" : `$${price.toLocaleString("en-US")}`;
}

function getInteractionUserId(interaction: DiscordInteraction): string | null {
  const id = interaction.member?.user?.id ?? interaction.user?.id;
  return typeof id === "string" && id ? id : null;
}

async function sendDirectMessage(
  userId: string,
  content: string,
  botToken: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!botToken) {
    return { ok: false, reason: "missing_bot_token" };
  }

  try {
    const channelResponse = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (!channelResponse.ok) {
      return { ok: false, reason: `create_channel_${channelResponse.status}` };
    }

    const channel = (await channelResponse.json()) as { id?: string };
    if (!channel.id) {
      return { ok: false, reason: "missing_dm_channel_id" };
    }

    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!messageResponse.ok) {
      return { ok: false, reason: `send_message_${messageResponse.status}` };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}
