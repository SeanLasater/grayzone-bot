# grayzone-bot

Cloudflare Worker Discord bot with a `/gz-loot` slash command that autocompletes Gray Zone Warfare lootables and sends size, weight, and sell price in a direct message.

## Requirements

- Node.js 20+
- Cloudflare account + Wrangler authentication
- Discord application with interactions endpoint configured

## Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Generate normalized loot artifact:

```bash
npm run normalize
```

3. Set env vars for command registration:

```bash
export DISCORD_APPLICATION_ID="your_app_id"
export DISCORD_BOT_TOKEN="your_bot_token"
export DISCORD_GUILD_ID="your_test_guild_id" # optional, uses global if omitted
```

4. Register slash command:

```bash
npm run register:commands
```

5. Configure worker secrets for request verification and DM delivery:

```bash
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_BOT_TOKEN
```

6. Run locally:

```bash
npm run dev
```

7. Deploy:

```bash
npm run deploy
```

## Discord Interactions

Set your Discord Interactions Endpoint URL to your worker URL, for example:

- Local tunnel/dev URL while testing
- `https://grayzone-bot.<your-subdomain>.workers.dev` in production

The bot verifies every incoming interaction with `DISCORD_PUBLIC_KEY`, sends `/gz-loot` results via DM, and uses an ephemeral acknowledgement in the channel.
