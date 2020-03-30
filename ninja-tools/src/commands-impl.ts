import commands from './commands';
import * as scrollToConversation from './scroll-to-conversation';
import * as message from './message';
import * as utils from './utils';
import * as prefs from './prefs';
import * as hostPanel from './host-panel';
import * as assetChangeListeners from './asset-change-listeners';
import * as whatsNew from './whats-new';
import * as help from './help';
import * as commandPalette from './command-palette';
import * as eventsViewer from './events-viewer';
import showFirstRunMessage from './show-first-run-message';
import getColors from './colors';
import pageLoadTime from './page-load-time';
import abTestCommands from './ab-test-commands';
import showInfoStyles from './commands-impl-show-info.css';
import * as prompt from './prompt';
import * as spotCommands from './spot-commands';

interface ICommandImpls {
  [key: string]: () => void;
}

let commandsImpl: ICommandImpls = {
  // scroll to conversation
  scrollToConversation: () => {
    scrollToConversation.toggle();
  },

  // copy spot id
  copySpotId: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      const spotId = utils.getSpotId(launcher);

      GM_setClipboard(spotId);
      message.set(`Copied ${spotId} to clipboard!`, {
        timeout: 2000,
        color: getColors().default,
        emoji: '😃',
      });
    }
  },

  // show info
  showInfo: () => {
    scrollToConversation.stop();

    function renderCopyableText(text) {
      unsafeWindow.__spotImNinjaToolsCopy = e => {
        const target = e.currentTarget;

        GM_setClipboard(target.parentElement.children[0].innerText);

        target.classList.add('showCheckmark');
        setTimeout(() => {
          target.classList.remove('showCheckmark');
        }, 1000);
      };

      return /*html*/ `
        <style>
          ${showInfoStyles}
        </style>
        <div class="infoLine">
          <div>${text}</div>
          <button onClick="__spotImNinjaToolsCopy(event)" class="copyButton">
            <div class="checkmark">✔</div>
            <div>Copy</div>
          </button>
        </div>
      `;
    }

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      const spotId = utils.getSpotId(launcher);
      const postId = utils.getPostId(launcher);
      const env = utils.isProduction(launcher) ? 'Production' : 'Dev';

      message.set(
        utils.renderTable([
          ['Spot Id', renderCopyableText(spotId)],
          ['Post Id', renderCopyableText(postId)],
          ['Environment', renderCopyableText(env)],
        ]),
        {
          color: getColors().default,
          title: 'Spot Info',
        }
      );
    }
  },

  // show versions
  showAssetVersions: async () => {
    scrollToConversation.stop();

    if (unsafeWindow.__SPOTIM__) {
      const assetsConfig =
        unsafeWindow.__SPOTIM__.SERVICES.configProvider._data.assets_config;

      const relevantAssets = assetsConfig.filter(
        item => item.url.indexOf('tags') > -1
      );

      if (relevantAssets.length) {
        const table =
          utils.renderTable(
            assetsConfig
              .filter(item => item.url.indexOf('tags') > -1)
              .sort((item1, item2) => (item1.name < item2.name ? -1 : 1))
              .map(item => [
                `<span class="mono"><a target="_blank" href="${item.url}">${
                  item.url.match(/tags\/(.*?)\//)[1]
                }</a></span>`,
                item.name,
              ])
          ) +
          `<div class="muted_text margin_top">Page loaded at ${pageLoadTime}</div>`;

        message.set(table, {
          color: getColors().default,
          emoji: utils.getRandomOptimisticEmoji(),
          title: 'Assets',
        });
      } else {
        message.set(`No assets found. Are you running locally?`, {
          timeout: 2000,
          color: getColors().error,
          emoji: '😕',
        });
      }
    } else {
      message.set(`Could not find __SPOTIM__ object`, {
        timeout: 2000,
        color: getColors().error,
        emoji: '😕',
      });
    }
  },

  // open admin panel
  openHostPanel: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      if (!utils.isProduction(launcher)) {
        // todo - fix staging host panel login
        window.open('https://admin.staging-spot.im/internal/super-admin');
      } else {
        hostPanel.open({ spotId: utils.getSpotId(launcher) });
      }
    }
  },

  // dumb open admin panel
  ssda: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      if (!utils.isProduction(launcher)) {
        window.open('https://admin.staging-spot.im/internal/super-admin');
      } else {
        window.open('https://admin.spot.im/internal/super-admin');
      }
    }
  },

  openConfigData: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (utils.isProduction(launcher)) {
      window.open(utils.getConfigUrl());
    }
  },

  notifyOnChanges: async () => {
    scrollToConversation.stop();

    assetChangeListeners.toggleNotifyOnChange();
  },

  toggleEventsViewer: () => {
    const { isShowing, shouldRefresh } = eventsViewer.toggle();

    if (isShowing) {
      if (shouldRefresh) {
        message.set('Please refresh the page to see the events', {
          timeout: 5000,
          emoji: '⚠️',
          color: getColors().default,
        });
      } else {
        message.set('I will show you events!', {
          timeout: 3000,
          emoji: '👍🏻',
          color: getColors().default,
        });
      }
    } else {
      message.set('Stopped showing events!', {
        timeout: 3000,
        emoji: '❌',
        color: getColors().default,
      });
    }
  },

  toggleShowEventsInConsole: () => {
    const showing = !eventsViewer.shouldShowEventsInConsole();
    eventsViewer.setShouldShowEventsInConsole(showing);

    message.set('Please refresh the page', {
      title: showing ? 'Showing events!' : 'Stopped showing events!',
      styleAsMessageBox: true,
      timeout: 6000,
      emoji: '👍🏻',
      color: getColors().default,
    });
  },

  toggleShowEventsInConsoleAllDomains: () => {
    const dontShow = !prefs.get().dontShowEventsInConsoleInAllDomains;
    prefs.set({ dontShowEventsInConsoleInAllDomains: dontShow });

    message.set(
      !dontShow
        ? 'Showing events in all domains!'
        : 'Stopped showing events in all domains!',
      {
        timeout: 6000,
        emoji: '👍🏻',
        color: getColors().default,
      }
    );
  },

  toggleShowAssetsVersions: async () => {
    const showVersionsOnLoad = prefs.get().showVersionsOnLoad;
    await prefs.set({ showVersionsOnLoad: !showVersionsOnLoad });

    if (!showVersionsOnLoad) {
      message.set('I will now show you asset versions on page load!', {
        timeout: 4000,
        emoji: '🤠',
        color: getColors().success,
      });
    } else {
      message.set('Stopped showing you asset versions on page load', {
        timeout: 4000,
        emoji: '❌',
        color: getColors().default,
      });
    }
  },

  whatsNew: () => {
    whatsNew.show();
  },

  setHostPanelCreds: () => {
    hostPanel.openCredentialsForm();
  },

  // copy post id
  copyPostId: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      const postId = utils.getPostId(launcher);

      GM_setClipboard(postId);
      message.set(`Copied ${postId} to clipboard!`, {
        timeout: 2000,
        color: getColors().default,
        emoji: '😃',
      });
    }
  },

  toggleDarkTheme: async () => {
    const { useDarkTheme = false } = prefs.get();
    await prefs.set({ useDarkTheme: !useDarkTheme });

    setTimeout(() => {
      commandPalette.show({
        commands,
        getCommandImpl,
        commandPaletteId: 'main',
      });
    }, 0);
  },

  modifyABTest: async () => {
    const abTestNumber = await prompt.show({ prompt: 'Enter A/B Test Number' });
    if (abTestNumber === '') {
      return;
    }

    const spotAB =
      JSON.parse(unsafeWindow.localStorage.getItem('SPOT_AB')) ?? {};
    const currentVariant = spotAB?.[abTestNumber]?.variant;

    const abTestVariant = (
      await prompt.show({
        prompt:
          'Enter a Variant' + (currentVariant ? ` (${currentVariant})` : ''),
      })
    ).toUpperCase();

    spotAB[abTestNumber] = {
      version: 'v2',
      ...spotAB[abTestNumber],
      short_name: abTestNumber,
      variant: abTestVariant,
    };

    unsafeWindow.localStorage.setItem('SPOT_AB', JSON.stringify(spotAB));

    message.set(
      `Successfully set test "${abTestNumber}" to "${abTestVariant}"!`,
      {
        color: getColors().success,
        emoji: '👍🏾',
      }
    );
  },

  searchSpots: () => {
    spotCommands.showPalette();
  },

  runSherlock: async () => {
    const GITHUB_NOT_FOUND_MESSAGE = '404: Not Found';

    const existingToken = prefs.get().sherlockToken;

    if (existingToken) {
      const script = (await utils.gmFetch(
        `https://raw.githubusercontent.com/SpotIM/sherlock/master/dist/bundle.js?token=${existingToken}`,
        'text'
      )) as string;

      if (script.trim() !== GITHUB_NOT_FOUND_MESSAGE) {
        unsafeWindow.eval(script);
        return;
      }
    }

    const token = await prompt.show({
      prompt: 'Enter Token',
      initialValue: prefs.get().sherlockToken,
    });

    prefs.set({ sherlockToken: token });

    const script = (await utils.gmFetch(
      `https://raw.githubusercontent.com/SpotIM/sherlock/master/dist/bundle.js?token=${token}`,
      'text'
    )) as string;

    if (script.trim() === GITHUB_NOT_FOUND_MESSAGE) {
      message.set('Are you sure your token is correct?', {
        title: 'Error Loading Sherlock',
        emoji: '😢',
        styleAsMessageBox: true,
        timeout: 7000,
        color: getColors().error,
      });

      return;
    }

    unsafeWindow.eval(script);
  },

  // show help
  showHelp: () => {
    scrollToConversation.stop();
    help.show();
  },

  showWelcomeMessage: () => {
    showFirstRunMessage(true);
  },
};

commandsImpl = (() => {
  return abTestCommands.reduce((commands, abCommand) => {
    return {
      ...commands,
      [`__ab${abCommand.id}`]: async () => {
        try {
          const spotAB = JSON.parse(
            unsafeWindow.localStorage.getItem('SPOT_AB')
          );
          const currentVariant = spotAB[abCommand.id].variant;
          const nextPossibleVariantChar = String.fromCharCode(
            currentVariant.charCodeAt(0) + 1
          );
          const nextVariant =
            abCommand.variants.find(
              variant => variant.id === nextPossibleVariantChar
            ) || abCommand.variants[0];

          let statusText;

          spotAB[abCommand.id].variant = nextVariant.id;
          statusText = nextVariant.statusText;

          message.set(statusText, {
            emoji: '👍🏻',
            color: getColors().success,
          });
          unsafeWindow.localStorage.setItem('SPOT_AB', JSON.stringify(spotAB));
        } catch (err) {
          message.set('Are you sure this spot has this test?', {
            title: `Couldn't ${abCommand.description}`,
            emoji: '😞',
            color: getColors().error,
          });
        }
      },
    };
  }, commandsImpl);
})();

export default commandsImpl;

export function getCommandImpl({ id }: { id: string }) {
  return commandsImpl[id]!;
}

export function getCommandImplByKeyCombo(keyCombo: string) {
  return commandsImpl[
    commands.find(command => command.keyCombo === keyCombo)?.id ?? ''
  ];
}
