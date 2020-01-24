export default [
  {
    name: 'Redesign',
    description: 'Toggle Redesign',
    id: 35,
    variants: [
      { id: 'A', statusText: 'Redesign Disabled' },
      { id: 'B', statusText: 'Redesign Enabled' },
    ],
  },
  {
    name: 'Reactions',
    description: 'Cycle Through Reaction Variants',
    id: 34,
    variants: [
      { id: 'A', statusText: 'Reactions Disabled' },
      { id: 'B', statusText: 'Reactions Enabled' },
      { id: 'C', statusText: 'Reactions Enabled (With Ads)' },
    ],
  },
  {
    name: 'Show Scores',
    description: 'Toggle Show Scores Before/After Click',
    id: 37,
    variants: [
      { id: 'A', statusText: 'Showing Scores After Click' },
      { id: 'B', statusText: 'Showing Scores Before Click' },
    ],
  },
].map((command, index) => ({ ...command, keyCombo: `__ssab${index}` }));
