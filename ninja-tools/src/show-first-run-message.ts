import * as prefs from './prefs';
import * as message from './message';
import colors from './colors';
import * as commandPalette from './command-palette';
import * as whatsNew from './whats-new';

export default async () => {
  const isNotFirstRun = await prefs.get().isNotFirstRun;
  if (!isNotFirstRun) {
    message.set("(you'll only see this message once)", {
      timeout: 3000,
      color: colors.default,
      title: 'Welcome to Spot.IM Ninja Tools!',
    });

    setTimeout(() => {
      commandPalette.show();
    }, 3500);

    await prefs.set({ isNotFirstRun: true });
    await whatsNew.setCurrentVersionAsLastShown();
  }
};
