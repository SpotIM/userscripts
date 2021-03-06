import * as scrollToConversation from './scroll-to-conversation';
import * as message from './message';
import * as utils from './utils';
import * as prefs from './prefs';
import getColors from './colors';
import * as shadowDOM from './shadow-dom';
import fuzzy from 'fuzzy';
import styles from './command-palette.css';
import { ICommand } from './commands';

// let selectedItemIndex = prefs.get().selectedItemIndex || 0;
let selectedItemIndex = 0;

async function show({
  commands,
  getCommandImpl,
  commandPaletteId,
  placeholder = 'Start Typing a Command...',
}: {
  commands: ICommand[];
  getCommandImpl: ({ id }: { id: string }) => () => void;
  commandPaletteId: string;
  placeholder?: string;
}) {
  selectedItemIndex = 0;
  let lastCommandThatRan;
  lastCommandThatRan = (() => {
    const { recentlyUsedCommands } = prefs.get();
    if (recentlyUsedCommands) {
      return commands.find(
        (command) => command.id === recentlyUsedCommands[commandPaletteId]
      );
    }
  })();

  scrollToConversation.stop({ hideMessage: false });
  let relevantCommands;

  const missingLauncherWarning = /*html*/ `<span class="titleIcon" title="Can't find Launcher script tag">⚠️</span>`;

  function renderDevBadge() {
    const buildTime = GM_info.script.version.split('.').pop();
    const secondsSinceBuild = Math.round(
      (new Date().getTime() - buildTime) / 1000
    );

    const buildAge =
      secondsSinceBuild <= 60
        ? secondsSinceBuild + 's'
        : Math.floor(secondsSinceBuild / 60) +
          ':' +
          String(secondsSinceBuild % 60).padStart(2, '0');

    return /*html*/ `
      <span class="badgeWrapper" title="Built ${buildAge} ago">
        💡
      </span>
    `;
  }

  function renderBetaBadge() {
    return /*html*/ `
      <span class="badgeWrapper">
        <span class="devBadge">beta</span>
      </span>
    `;
  }

  function handleTableClick(e) {
    const line = e.target.closest('.pallete_row_main_col');
    if (line && line.children.length) {
      const commandId = line.querySelector('[data-command-id]').dataset
        .commandId;
      const commandImpl = getCommandImpl({ id: commandId });
      const { recentlyUsedCommands } = prefs.get();
      prefs.set({
        recentlyUsedCommands: {
          ...recentlyUsedCommands,
          [commandPaletteId]: commandId,
        },
      });

      if (commandImpl) {
        setTimeout(() => {
          commandImpl();
        }, 0);
      }
    }
  }

  const { messageBodyEl } = message.set(
    /*html*/ `<style>
      ${styles}
    </style>
    <div class="inputWrapper">
      <div class="indicators">
        ${process.env.NODE_ENV === 'development' ? renderDevBadge() : ''}
        ${!utils.getLauncherEl(false) ? missingLauncherWarning : ''}
      </div>
      <input class="input" placeholder="${placeholder}">
    </div>
    <div class="results"></div>`,
    {
      color: getColors().default,
      hideCloseButton: true,
    }
  );

  messageBodyEl!
    .querySelector('.results')!
    .addEventListener('click', handleTableClick);

  const input = shadowDOM.get().querySelector('.input') as HTMLInputElement;
  updateRelevantResults();
  renderResults();
  input.focus();

  function runSelectedCommand() {
    const selectedCommand = relevantCommands[selectedItemIndex];

    lastCommandThatRan = selectedCommand;
    const { recentlyUsedCommands } = prefs.get();
    prefs.set({
      recentlyUsedCommands: {
        ...recentlyUsedCommands,
        [commandPaletteId]: lastCommandThatRan?.id,
      },
    });

    if (selectedCommand) {
      message.hide(true);
      getCommandImpl({ id: selectedCommand.id })!();
      return true;
    }

    return false;
  }

  function updateRelevantResults() {
    // const value = input.value.replace(/ /g, ".");
    const value = input.value;
    // const regExp = new RegExp(value, 'i');

    const fuzzyResults = fuzzy.filter(value, commands, {
      pre: '<span class="fuzzyHighlight">',
      post: '</span>',
      extract: (command) => command.description,
    });

    relevantCommands = fuzzyResults.map((result) => ({
      ...commands[result.index],
      description: result.string,
    }));

    // relevantCommands = commands.filter(
    //   command =>
    //     command.description.match(regExp) ||
    //     command.keyCombo.match(regExp) ||
    //     (command.keywords && command.keywords.match(regExp))
    // );

    if (!value && lastCommandThatRan) {
      const lastCommandIndex = relevantCommands.findIndex(
        (command) => command.id === lastCommandThatRan?.id
      );

      relevantCommands.splice(lastCommandIndex, 1);

      relevantCommands.unshift(lastCommandThatRan);
    }
  }

  function renderResults(scrollAlignToTop?: boolean) {
    if (input.value.trim()) {
      messageBodyEl!.querySelector('.results')!.classList.add('inputNotEmpty');
    } else {
      messageBodyEl!
        .querySelector('.results')!
        .classList.remove('inputNotEmpty');
    }

    messageBodyEl!.querySelector(
      '.results'
    )!.innerHTML = relevantCommands.length
      ? relevantCommands
          .map(
            (command, index) => /*html*/ `<span
            class="pallete_row_main_col ${
              selectedItemIndex === index ? 'weight_bold' : 'muted_result'
            }"
            ${selectedItemIndex === index ? 'data-selected' : ''}
            >
            <div class="palette_row_description">${command.description}</div>
            ${
              lastCommandThatRan === command
                ? "<div class='palette_row_recently_used'>recently used</div>"
                : ''
            }
            <span class="mono ${
              !command.keyCombo ? 'hidden' : ''
            }" data-command-id="${command.id}">${
              !command.keyCombo ? '×' : command.keyCombo
            }</span>
            ${
              selectedItemIndex === index
                ? utils.createElement('⏎', 'muted_text')
                : ''
            }
          </span>`
          )
          .join('')
      : '';

    function isResultLineVisible(lineEl) {
      const lineBounds = lineEl.getBoundingClientRect();
      const resultsBounds = shadowDOM
        .get()
        .querySelector('.results')!
        .getBoundingClientRect();
      return (
        lineBounds.y > resultsBounds.y &&
        lineBounds.bottom < resultsBounds.bottom
      );
    }

    const selectedLineTr = shadowDOM.get().querySelector('[data-selected]');
    if (selectedLineTr) {
      const selectedLine = selectedLineTr as HTMLSpanElement;
      if (!isResultLineVisible(selectedLine)) {
        selectedLine.scrollIntoView(scrollAlignToTop);
      }
      // unsafeWindow.shadow = shadowDOM.get();
    }
  }

  input.addEventListener('keydown', (e) => {
    if (e.keyCode === 38) {
      selectedItemIndex--;
      if (selectedItemIndex < 0) {
        selectedItemIndex = relevantCommands.length - 1;
      }
      // prefs.set({ selectedItemIndex });
      e.preventDefault();
      renderResults(true);
    } else if (e.keyCode === 40) {
      selectedItemIndex++;
      if (selectedItemIndex >= relevantCommands.length) {
        selectedItemIndex = 0;
      }
      // prefs.set({ selectedItemIndex });
      e.preventDefault();
      renderResults(false);
    } else if (e.keyCode === 13) {
      if (runSelectedCommand()) {
        return;
      }
    } else if (['Meta', 'Alt', 'Shift', 'Control'].indexOf(e.key) === -1) {
      renderResults();

      if (location.host.endsWith('msn.com')) {
        setTimeout(() => {
          shadowDOM.get().querySelector<HTMLInputElement>('.input')?.focus();
        }, 0);
      }
    }
  });

  input.addEventListener('keyup', (e) => {
    updateRelevantResults();
    if (selectedItemIndex >= relevantCommands.length) {
      selectedItemIndex = Math.max(relevantCommands.length - 1, 0);
    }
    if (
      e.keyCode !== 38 &&
      e.keyCode !== 40 &&
      ['Meta', 'Alt', 'Shift', 'Control'].indexOf(e.key) === -1
    ) {
      renderResults();
    }
  });
}

export { show };
