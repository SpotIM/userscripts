export interface IPreferences {
  autoScroll: boolean;
  selectedItemIndex: number;
  showVersionsOnLoad: boolean;
  eventsQueryHistory: string[];
  eventsQuery: string;
  eventsViewerPosition: { [key: string]: { x: number; y: number } };
  showEventsViewer: boolean;
  isNotFirstRun: boolean;
  lastWhatsNewVersion: string;
  dontShowWhatsNew: boolean;
  useDarkTheme: boolean;
  recentlyUsedCommands: { [commandPaletteId: string]: string };
  dontShowEventsInConsoleInAllDomains: boolean;
  dontShowEventsInConsole?: { [hostname: string]: boolean };
}

export const get = (): IPreferences => {
  return GM_getValue('prefs', {});
};

export const set = (newPrefs: Partial<IPreferences>) => {
  return GM_setValue('prefs', { ...get(), ...newPrefs });
};
