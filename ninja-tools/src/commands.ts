import abTestCommands from './ab-test-commands';

export interface ICommand {
  keyCombo: string;
  description: string;
  detailedDescription?: string;
  keywords?: string;
  unlisted?: boolean;
}

const commands: ICommand[] = [
  { keyCombo: 'sss', description: 'Scroll to Conversation' },
  { keyCombo: 'ssi', description: 'Show Info' },
  {
    keyCombo: 'ssc',
    description: 'Copy Spot ID to Clipboard',
  },
  {
    keyCombo: 'ssa',
    description: 'Open Host Panel',
    detailedDescription:
      'Will require you to enter the username and password you use to log in to the host panel on first run ' +
      "and won't work if you use Google to sign in",
    keywords: 'admin',
  },
  { keyCombo: 'ssv', description: 'Show Asset Versions', keywords: 'assets' },
  { keyCombo: 'sso', description: 'Open Config Data' },
  {
    keyCombo: 'ssn',
    description: 'Notify On Asset Updates',
    detailedDescription:
      'Will start constantly checking if an update to one of our products was released for this spot and pop a notification once that happens',
    keywords: 'changes',
  },
  { keyCombo: 'ssh', description: 'Show Help' },
  {
    keyCombo: '__ssn',
    description: "What's New?",
    unlisted: true,
  },
  {
    keyCombo: '__ssa',
    description: 'Toggle Show Asset Versions on Load',
    detailedDescription:
      'If enabled, will display the asset versions once the page loads',
    unlisted: true,
  },
  {
    keyCombo: '__ssc',
    description: 'Set Host Panel Credentials',
    unlisted: true,
  },
  ...abTestCommands.map(abCommand => ({
    keyCombo: abCommand.keyCombo,
    description: 'A/B Test: ' + abCommand.description,
    unlisted: true,
  })),
];

export default commands;
