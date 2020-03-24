import abTestCommands from './ab-test-commands';

export interface ICommand {
  id: string;
  keyCombo?: string;
  description: string;
  detailedDescription?: string;
}

const commands: ICommand[] = [
  {
    id: 'scrollToConversation',
    keyCombo: 'sss',
    description: 'Scroll to Conversation',
  },
  { id: 'showInfo', keyCombo: 'ssi', description: 'Show Info' },
  {
    id: 'copySpotId',
    keyCombo: 'ssc',
    description: 'Copy Spot ID to Clipboard',
  },
  {
    id: 'openHostPanel',
    keyCombo: 'ssa',
    description: 'Open Host Panel',
    detailedDescription:
      'Will require you to enter the username and password you use to log in to the host panel on first run ' +
      "and won't work if you use Google to sign in",
  },
  {
    id: 'showAssetVersions',
    keyCombo: 'ssv',
    description: 'Show Asset Versions',
  },
  { id: 'openConfigData', keyCombo: 'sso', description: 'Open Config Data' },
  {
    id: 'notifyOnChanges',
    keyCombo: 'ssn',
    description: 'Notify On Config Updates',
    detailedDescription:
      'Will notify you once an asset updates or a configuration changes for the current spot',
  },
  {
    id: 'toggleEventsViewer',
    keyCombo: 'sse',
    description: 'Toggle Events Viewer',
  },
  { id: 'showHelp', keyCombo: 'ssh', description: 'Show Help' },
  {
    id: 'whatsNew',
    description: "What's New?",
  },
  {
    id: 'toggleDarkTheme',
    description: 'Toggle Dark Theme',
  },
  {
    id: 'toggleShowAssetsVersions',
    description: 'Toggle Show Asset Versions on Load',
    detailedDescription:
      'If enabled, will display the asset versions once the page loads',
  },
  {
    id: 'setHostPanelCreds',
    description: 'Set Host Panel Credentials',
  },
  {
    id: 'copyPostId',
    description: 'Copy Post ID to Clipboard',
  },
  {
    id: 'modifyABTest',
    description: 'Modify A/B Test',
  },
  {
    id: 'searchSpots',
    description: 'Search Spots 🧪',
  },
  {
    id: 'toggleShowEventsInConsole',
    description: 'Toggle Show Events in Console',
  },
  ...abTestCommands.map(abCommand => ({
    id: `__ab${abCommand.id}`,
    description: 'A/B Test: ' + abCommand.description,
  })),
];

if (process.env.NODE_ENV === 'development') {
  commands.push({
    id: 'showWelcomeMessage',
    description: 'Show Welcome Message',
  });
}

export default commands;
