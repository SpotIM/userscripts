interface IABTest {
  name: string;
  description: string;
  id: number;
  variants: { id: string; statusText: string }[];
}

const abTests: IABTest[] = [
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
  {
    name: 'Show Feed',
    description: 'Toggle Show Feed',
    id: 39,
    variants: [
      { id: 'A', statusText: 'Showing Feed' },
      { id: 'B', statusText: 'Not Showing Feed' },
    ],
  },
  {
    name: 'Change Feed Placement',
    description: 'Toggle Feed Above/Below Conversation',
    id: 40,
    variants: [
      { id: 'A', statusText: 'Feed Above Conversation' },
      { id: 'B', statusText: 'Feed Below Conversation' },
    ],
  },
];

export default abTests;
