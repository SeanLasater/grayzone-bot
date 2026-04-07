const env = {
  applicationId: process.env.DISCORD_APPLICATION_ID,
  botToken: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
};

if (!env.applicationId || !env.botToken) {
  throw new Error("Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN.");
}

const commandPayload = [
  {
    name: "gz-loot",
    description: "Look up Gray Zone Warfare loot item details.",
    options: [
      {
        type: 3,
        name: "lootable",
        description: "The loot item name",
        required: true,
        autocomplete: true,
      },
    ],
  },
];

const route = env.guildId
  ? `https://discord.com/api/v10/applications/${env.applicationId}/guilds/${env.guildId}/commands`
  : `https://discord.com/api/v10/applications/${env.applicationId}/commands`;

const response = await fetch(route, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bot ${env.botToken}`,
  },
  body: JSON.stringify(commandPayload),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`Command registration failed: ${response.status} ${body}`);
}

const result = await response.json();
console.log(`Registered ${result.length} command(s) at ${env.guildId ? "guild" : "global"} scope.`);
