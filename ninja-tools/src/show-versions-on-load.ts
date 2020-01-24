import * as prefs from './prefs';
import commandsImpl from './commands-impl';
import * as utils from './utils';

export default async () => {
  if ((await prefs.get()).showVersionsOnLoad) {
    function handleSpotimObjectFound() {
      if (unsafeWindow.__SPOTIM__.SERVICES.configProvider._data.assets_config) {
        commandsImpl.ssv();
      } else {
        setTimeout(() => {
          utils.onFoundSpotimObject(handleSpotimObjectFound);
        }, 500);
      }
    }

    utils.onFoundSpotimObject(handleSpotimObjectFound);
  }
};
