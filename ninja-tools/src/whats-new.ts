import * as prefs from './prefs';
import * as message from './message';
import gutterActions from './gutter-actions';
import styles from './whats-new.css';
import getColors from './colors';

const changelog = [
  {
    version: '4.2.8',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Displaying Current Spot\'s Rail in "Show Info"',
        description:
          'Open the palette, run "Show Info", the spot\'s rail will now be displayed',
      },
    ],
  },
  {
    version: '4.2.3',
    showOnFirstLoad: false,
    list: [
      {
        title: 'Added Toggle Show Events in Console on All Domains',
      },
    ],
  },
  {
    version: '4.2.2',
    showOnFirstLoad: false,
    list: [
      {
        title: 'Added Toggle Show Events in Console',
      },
    ],
  },
  {
    version: '4.2.1',
    showOnFirstLoad: false,
    list: [
      {
        title: 'Improved UI',
        description:
          'UI is now more consistent with other, popular command palettes',
      },
      {
        title: 'Added Modify A/B Test Command',
        description:
          'Modify any A/B test by specifying its id and a variant (A/B/C...)',
      },
      {
        title: 'Showing time spent BI events',
      },
    ],
  },
  {
    version: '4.2.0',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Performance Improvements',
        description:
          'Previously Ninja Tools would run as soon the page was idle, it will now run as soon as the page starts loading',
      },
      {
        title: 'Added Spot Commands',
        description:
          "Access other spots from whichever website you are currently on. Hit Ctrl+Shift+S, start typing a spot's name, hit Enter and you will have access to the following commands",
        list: [
          {
            title: "Open spot's website",
          },
          {
            title: 'Open post page 🧪',
          },
          {
            title: 'Copy spot id',
          },
          {
            title: "Open spot's host panel",
          },
        ],
      },
    ],
  },
  {
    version: '4.1.0',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Added Events Viewer',
        description:
          'Shows BI events on the page, exposing only the diffs between similarly typed events',
      },
    ],
  },
  {
    version: '4.0.5',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Added Dark Mode (Toggle Dark Mode in the Command Palette)',
      },
    ],
  },
  {
    version: '4.0.2',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Added Set Credentials Command and Credentials Form',
      },
    ],
  },
  {
    version: '3.7',
    showOnFirstLoad: true,
    list: [
      {
        title: 'Added Recently Used commands',
        description:
          'The command you last used will show up first, next time you open the command palette',
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
          { title: 'A/B Test: Toggle Redesign' },
          { title: 'A/B Test: Cycle Through Reaction Variants' },
          { title: 'A/B Test: Toggle Show Scores Before/After Click' },
        ],
      },
    ],
  },
];

function renderList(list) {
  return list
    .map((listItem) => {
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
    <style>
      ${styles}
    </style>
    <div class="whatsNewWrapper">
      <div class="whatsNewContent">
        ${renderChangesInVersion(changelog[0], true)}
        ${changelog
          .slice(1)
          .map((change) => renderChangesInVersion(change))
          .join('')}
      </div>
      <div class="whatsNewFeatureRequest">
        💡 Got a feature request? <a href="slack://channel?id=CSZGJD6R1&team=T0460KVUF">Hit us up on Slack!</a>
      </div>
      ${renderButtons()}
    </div>
  `;

  return { html, addListeners };
}

async function show(hasUpgraded?: boolean) {
  const currentVersion = GM_info.script.version;
  const { dontShowWhatsNew } = prefs.get();
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

  function handleToggleShowNextTime() {
    const { dontShowWhatsNew } = prefs.get();
    prefs.set({ dontShowWhatsNew: !dontShowWhatsNew });
  }

  whatsNew.addListeners((index) => {
    if (index === 0) {
      handleToggleShowNextTime();
      handleClose();
      const { dontShowWhatsNew } = prefs.get();

      if (dontShowWhatsNew) {
        message.set(
          "You can change this later on through the What's New screen",
          {
            title: 'I will not show you updates anymore',
            color: getColors().default,
            emoji: '👌',
            timeout: 6000,
            styleAsMessageBox: true,
          }
        );
      } else {
        message.set('I will show you what has changed next time!', {
          color: getColors().default,
          emoji: '👍🏻',
          timeout: 4000,
        });
      }
    } else {
      handleClose();
    }
  });
}

async function showIfUpgraded() {
  const isNotFirstRun = prefs.get().isNotFirstRun;
  if (isNotFirstRun) {
    const { lastWhatsNewVersion, dontShowWhatsNew } = prefs.get();
    const currentVersion = GM_info.script.version;

    if (dontShowWhatsNew) {
      return;
    }

    if (
      (!lastWhatsNewVersion || lastWhatsNewVersion !== currentVersion) &&
      changelog.find((entry) => entry.version === currentVersion)
        ?.showOnFirstLoad
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
