import { GZ_LOOT_COMMAND } from "./discord/command";
import { InteractionResponseType, InteractionType, MessageFlags, type DiscordInteraction } from "./discord/types";
import { verifyDiscordRequest } from "./discord/verify";
import { getLootItemByName, searchLootItems } from "./data/loot";

type Env = {
  DISCORD_PUBLIC_KEY: string;
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
      return Response.json(
        {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Unknown command.",
            flags: MessageFlags.EPHEMERAL,
          },
        },
        { status: 200 },
      );
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

      if (!lootItem) {
        return Response.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "I could not find that loot item. Try using autocomplete from the command option.",
            flags: MessageFlags.EPHEMERAL,
          },
        });
      }

      return Response.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: [
            `**${lootItem.name}**`,
            `Size: ${lootItem.size}`,
            `Weight: ${lootItem.weight}`,
            `Sell Price: ${formatPrice(lootItem.sellPrice)}`,
          ].join("\n"),
          flags: MessageFlags.EPHEMERAL,
        },
      });
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
