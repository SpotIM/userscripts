import abTestCommands from './ab-test-commands';
import * as prefs from './prefs';
import * as message from './message';
import * as shadowDOM from './shadow-dom';
import gutterActions from './gutter-actions';

const changelog = [
  {
    version: '4.0.2',
    list: [
      {
        title: 'Added Set Credentials Command and Credentials Form',
      },
    ],
  },
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

function renderChangesInVersion(versionDetails, isLatest?: boolean) {
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
  const [renderButtons, addListeners] = gutterActions([
    isShowingWhatsNewOnUpgrade
      ? "Don't Show Me What's New On Upgrade"
      : "Show Me What's New Next Upgrade",
    'Close',
  ]);

  const html = /*html*/ `
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
            ${renderButtons()}
          </div>
        `;

  return { html, addListeners };
}

async function show(hasUpgraded?: boolean) {
  const currentVersion = GM_info.script.version;
  const { dontShowWhatsNew } = await prefs.get();
  await prefs.set({ lastWhatsNewVersion: currentVersion });
  const whatsNew = renderWhatsNew(!dontShowWhatsNew);

  message.set(whatsNew.html, {
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

  whatsNew.addListeners(index => {
    if (index === 0) {
      handleCloseAndToggleShowNextTime();
    } else {
      handleClose();
    }
  });
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

async function setCurrentVersionAsLastShown() {
  const currentVersion = GM_info.script.version;
  await prefs.set({ lastWhatsNewVersion: currentVersion });
}

export { setCurrentVersionAsLastShown, showIfUpgraded, show };
