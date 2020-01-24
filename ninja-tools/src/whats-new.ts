const changelog = [
  {
    version: '3.7',
    list: [
      {
        title: 'Added Recently Used commands',
        description:
          'The command you last used will show up first, next time you hit Ctrl+S',
      },
    ],
  },
  {
    version: '3.4',
    list: [
      {
        title: 'The following commands were added:',
        list: [
          {
            title: 'Toggle Show Asset Versions on Load',
            description:
              'If enabled, will show the asset versions popup once the page loads',
          },
          ...abTestCommands.map(command => ({ title: command.description })),
        ],
      },
    ],
  },
];

function renderList(list) {
  return list
    .map(listItem => {
      return /*html*/ `
          <li>
            ${listItem.title}
            ${
              listItem.description
                ? /*html*/ `<div class="whatsNewDescription">${listItem.description}</div>`
                : ''
            }
          </li>
          ${listItem.list ? '<ul>' + renderList(listItem.list) + '</ul>' : ''}
        `;
    })
    .join('');
}

function renderChangesInVersion(versionDetails, isLatest) {
  const className = isLatest ? 'latest' : '';

  return /*html*/ `
          <div class="whatsNewTitle ${className}">${
    isLatest
      ? `⭐️ What's New in v${versionDetails.version}:`
      : '✨ v' + versionDetails.version + ':'
  }</div>
          <ul class="${className}">
            ${renderList(versionDetails.list)}
          </ul>
        `;
}

function renderWhatsNew(isShowingWhatsNewOnUpgrade) {
  return /*html*/ `
          <div class="whatsNewWrapper">
            <div class="whatsNewContent">
              ${renderChangesInVersion(changelog[0], true)}
              ${changelog
                .slice(1)
                .map(change => renderChangesInVersion(change))
                .join('')}
            </div>
            <div class="whatsNewFeatureRequest">
              💡 Got a feature request? <a href="slack://channel?id=D9SQV11P1&team=T0460KVUF">Hit me up on Slack!</a>
            </div>
            <div class="whatsNewGutter">
              <button class="whatsNewButton whatsNewCloseAndToggleShowButton">
                ${
                  isShowingWhatsNewOnUpgrade
                    ? "Don't Show Me What's New On Upgrade"
                    : "Show Me What's New Next Upgrade"
                }
              </button>
              <button class="whatsNewButton whatsNewCloseButton">
                Close
              </button>
            </div>
          </div>
        `;
}

async function show(hasUpgraded) {
  const currentVersion = GM_info.script.version;
  const { dontShowWhatsNew } = await prefs.get();
  await prefs.set({ lastWhatsNewVersion: currentVersion });

  message.set(renderWhatsNew(!dontShowWhatsNew), {
    title: hasUpgraded
      ? `SpotIM Ninja Tools Upgraded! 🥳`
      : 'SpotIM Ninja Tools Changelog',
  });

  function handleClose() {
    message.hide(true);
  }

  async function handleCloseAndToggleShowNextTime() {
    const { dontShowWhatsNew } = await prefs.get();
    await prefs.set({ dontShowWhatsNew: !dontShowWhatsNew });
    message.hide(true);
  }

  shadowDOM
    .querySelector('.whatsNewCloseButton')
    .addEventListener('click', handleClose);
  shadowDOM
    .querySelector('.whatsNewCloseAndToggleShowButton')
    .addEventListener('click', handleCloseAndToggleShowNextTime);
}

async function showIfUpgraded() {
  const isNotFirstRun = await prefs.get().isNotFirstRun;
  if (isNotFirstRun) {
    const { lastWhatsNewVersion, dontShowWhatsNew } = await prefs.get();
    const currentVersion = GM_info.script.version;

    if (dontShowWhatsNew) {
      return;
    }

    if (
      (!lastWhatsNewVersion || lastWhatsNewVersion !== currentVersion) &&
      changelog.find(entry => entry.version === currentVersion)
    ) {
      show(true);
    }

    await prefs.set({ lastWhatsNewVersion: currentVersion });
  }
}

showIfUpgraded();

export { show };
