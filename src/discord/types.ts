export const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
} as const;

export const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
} as const;

export const MessageFlags = {
  EPHEMERAL: 1 << 6,
} as const;

export type DiscordInteraction = {
  type: number;
  data?: {
    name?: string;
    options?: Array<{
      name: string;
      type: number;
      value?: string;
      focused?: boolean;
    }>;
  };
};
