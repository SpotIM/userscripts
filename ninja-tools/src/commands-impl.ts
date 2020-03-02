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

interface ICommandImpls {
  [key: string]: () => void;
}

let commandsImpl: ICommandImpls = {
  // scroll to conversation
  sss: () => {
    scrollToConversation.toggle();
  },

  // copy spot id
  ssc: () => {
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
  ssi: () => {
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
  ssv: async () => {
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
  ssa: () => {
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

  sso: () => {
    scrollToConversation.stop();

    const launcher = utils.getLauncherEl(true);
    if (utils.isProduction(launcher)) {
      window.open(utils.getConfigUrl());
    }
  },

  ssn: async () => {
    scrollToConversation.stop();

    assetChangeListeners.toggleNotifyOnChange();
  },

  sse: () => {
    const isShowingEventsViewer = eventsViewer.toggle();

    if (isShowingEventsViewer) {
      message.set('I will show you events!', {
        timeout: 3000,
        emoji: '👍🏻',
        color: getColors().default,
      });
    } else {
      message.set('Stopped showing events!', {
        timeout: 3000,
        emoji: '❌',
        color: getColors().default,
      });
    }
  },

  __ssa: async () => {
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

  __ssn: () => {
    whatsNew.show();
  },

  __ssc: () => {
    hostPanel.openCredentialsForm();
  },

  // copy post id
  __ssp: () => {
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

  __ssdt: async () => {
    const { useDarkTheme = false } = prefs.get();
    await prefs.set({ useDarkTheme: !useDarkTheme });

    setTimeout(() => {
      commandPalette.show();
    }, 0);
  },

  // show help
  ssh: () => {
    scrollToConversation.stop();
    help.show();
  },
};

commandsImpl = (() => {
  return abTestCommands.reduce((commands, abCommand) => {
    return {
      ...commands,
      [abCommand.keyCombo]: async () => {
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

if (process.env.NODE_ENV === 'development') {
  commandsImpl.ssw = () => {
    showFirstRunMessage(true);
  };
}

export default commandsImpl;
