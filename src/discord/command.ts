export const GZ_LOOT_COMMAND = {
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
};
