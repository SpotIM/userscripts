let commandsImpl: any = {
  // scroll to conversation
  sss: () => {
    scrolling.toggle();
  },

  // copy spot id
  ssc: () => {
    scrolling.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      const spotId = utils.getSpotId(launcher);

      // if (navigator.clipboard) {
      GM_setClipboard(spotId);
      message.set(`Copied ${spotId} to clipboard!`, {
        timeout: 2000,
        color: colors.default,
        emoji: '😃',
      });
      // } else {
      //   message.set(`Can't copy ${spotId} to clipboard on non-https sites`, {
      //     timeout: 4000,
      //     color: colors.error,
      //     emoji: "😞"
      //   });
      // }
    }
  },

  // show info
  ssi: () => {
    scrolling.stop();

    const launcher = utils.getLauncherEl(true);
    if (launcher) {
      const spotId = utils.getSpotId(launcher);
      const postId = utils.getPostId(launcher);
      const version = utils.getSpotimVersion() === 2 ? 'V.2.0' : 'V.1.0';
      const env = utils.isProduction(launcher) ? 'Production' : 'Dev';

      message.set(
        utils.renderTable([
          ['Spot Id', utils.createElement(spotId, 'weight_normal')],
          ['Post Id', utils.createElement(postId, 'weight_normal')],
          ['Environment', utils.createElement(env, 'weight_normal')],
        ]),
        {
          // timeout: 8000,
          color: colors.default,
          title: 'Spot Info',
        }
      );
    }
  },

  // show versions
  ssv: async () => {
    scrolling.stop();

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
                `<span class="sptmninja_mono"><a target="_blank" href="${
                  item.url
                }">${item.url.match(/tags\/(.*?)\//)[1]}</a></span>`,
                item.name,
              ])
          ) +
          `<div class="sptmninja_muted_text sptmninja_margin_top">Page loaded at ${pageLoadTime}</div>`;

        message.set(table, {
          color: colors.default,
          emoji: utils.getRandomOptimisticEmoji(),
          title: 'Assets',
        });
      } else {
        message.set(`No assets found. Are you running locally?`, {
          timeout: 2000,
          color: colors.error,
          emoji: '😕',
        });
      }
    } else {
      message.set(`Could not find __SPOTIM__ object`, {
        timeout: 2000,
        color: colors.error,
        emoji: '😕',
      });
    }
  },

  // open admin panel
  ssa: () => {
    scrolling.stop();

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
    scrolling.stop();

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
    scrolling.stop();

    const launcher = utils.getLauncherEl(true);
    if (utils.isProduction(launcher)) {
      window.open(utils.getConfigUrl());
    }
  },

  ssn: async () => {
    scrolling.stop();

    assetChangeListener.toggleNotifyOnChange();
  },

  __ssa: async () => {
    const showVersionsOnLoad = await prefs.get().showVersionsOnLoad;
    await prefs.set({ showVersionsOnLoad: !showVersionsOnLoad });

    if (!showVersionsOnLoad) {
      message.set('I will now show you asset versions on page load!', {
        timeout: 4000,
        emoji: '🤠',
        color: colors.success,
      });
    } else {
      message.set('I will stop showing you asset versions on page load', {
        timeout: 4000,
        emoji: '❌',
        color: colors.default,
      });
    }
  },

  __ssn: () => {
    whatsNew.show();
  },

  // show help
  ssh: () => {
    scrolling.stop();
    help.show();
  },
};

const abTestCommands = (() => {
  return [
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
})();

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
            emoji: '😃',
            color: colors.success,
          });
          unsafeWindow.localStorage.setItem('SPOT_AB', JSON.stringify(spotAB));
        } catch (err) {
          message.set('Are you sure this spot has this test?', {
            title: `Couldn't ${abCommand.description}`,
            emoji: '😞',
            color: colors.error,
          });
        }
      },
    };
  }, commandsImpl);
})();
