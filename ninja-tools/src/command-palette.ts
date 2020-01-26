import commands from './commands';
import * as scrollToConversation from './scroll-to-conversation';
import * as message from './message';
import * as utils from './utils';
import * as prefs from './prefs';
import colors from './colors';
import commandsImpl from './commands-impl';
import * as shadowDOM from './shadow-dom';
import fuzzy from 'fuzzy';

// let selectedItemIndex = prefs.get().selectedItemIndex || 0;
let selectedItemIndex = 0;

function handleTableClick(e) {
  const line = e.target.closest('.sptmninja_tr');
  if (line && line.children.length) {
    const keyCombo = line.children[0].children[0].dataset.keyCombo;
    const commandImpl = commandsImpl[keyCombo];

    if (commandImpl) {
      commandImpl();
    }
  }
}

async function show() {
  selectedItemIndex = 0;
  let lastCommandThatRan = await (async () => {
    const { lastCommandThatRanKeyCombo } = await prefs.get();
    if (lastCommandThatRanKeyCombo) {
      return commands.find(
        command => command.keyCombo === lastCommandThatRanKeyCombo
      );
    }
  })();

  scrollToConversation.stop({ hideMessage: false });
  let relevantCommands;

  const missingLauncherWarning = /*html*/ `<span class="sptmninja_titleIcon" title="Can't find Launcher script tag">⚠️</span>`;

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
      <style>
        .badgeWrapper {
          left: 11px;
          position: absolute;
          top: 14px;
          display: flex;
          align-items: baseline;
        }

        .devBadge {
          padding: 3px 7px 1px;
          border-radius: 6px 0px 0px 6px;
          background: #E91E63;
          font-weight: normal;
          text-transform: uppercase;
          font-size: 0.7em;
          margin-right: 0px;
          display: block;
          text-shadow: none;
          box-shadow: 0px 0px 6px inset #000000a1, 0px -1px #00000080;
        }

        .buildAge {
          font-size: 0.8em;
          padding: 3px 7px 1px;
          border-radius: 0px 6px 6px 0px;
          background: #FF5722;
          font-weight: normal;
          font-size: 0.7em;
          margin-right: 12px;
          display: block;
          color: white;
          text-shadow: none;
          box-shadow: 0px -1px #00000080;
        }
      </style>
      <span class="badgeWrapper">
        <span class="devBadge">dev</span>
        <span class="buildAge" title="Time since built">${buildAge}</span>
      </span>
    `;
  }

  const messageBodyEl = message.set(
    /*html*/ `<style>
      .fuzzyHighlight {
        color: #FFEB3B;
        font-weight: bold;
      }

      .inputNotEmpty .sptmninja_pallete_row_main_col {
        font-weight: normal;
      }
    </style>
    <input class="sptmninja_input"><div class="sptmninja_results"></div>`,
    {
      title: `${
        !utils.getLauncherEl(false) ? missingLauncherWarning : ''
      }Start Typing A Command${
        process.env.NODE_ENV === 'development' ? renderDevBadge() : ''
      }`,
      color: colors.default,
    }
  );

  messageBodyEl
    .querySelector('.sptmninja_results')
    .addEventListener('click', handleTableClick);

  const input = shadowDOM.get().querySelector('.sptmninja_input');
  updateRelevantResults();
  renderResults();
  input.focus();

  function runSelectedCommand() {
    const selectedCommand = relevantCommands[selectedItemIndex];
    lastCommandThatRan = selectedCommand;
    prefs.set({ lastCommandThatRanKeyCombo: lastCommandThatRan?.keyCombo });

    if (selectedCommand) {
      message.hide(true);
      commandsImpl[selectedCommand.keyCombo]();
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
      extract: command => command.description,
    });

    relevantCommands = fuzzyResults.map(result => ({
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
        command => command.keyCombo === lastCommandThatRan?.keyCombo
      );

      relevantCommands.splice(lastCommandIndex, 1);

      relevantCommands.unshift(lastCommandThatRan);
    }
    // .filter(command => value !== "" || !command.unlisted);
  }

  function renderResults(scrollAlignToTop?: boolean) {
    if (input.value.trim()) {
      messageBodyEl
        .querySelector('.sptmninja_results')
        .classList.add('inputNotEmpty');
    } else {
      messageBodyEl
        .querySelector('.sptmninja_results')
        .classList.remove('inputNotEmpty');
    }

    messageBodyEl.querySelector(
      '.sptmninja_results'
    ).innerHTML = relevantCommands.length
      ? utils.renderTable(
          relevantCommands.map((command, index) => [
            `<span class="sptmninja_mono ${
              command.unlisted ? 'sptmninja_hidden' : ''
            }" data-key-combo="${command.keyCombo}">${
              command.unlisted ? '×' : command.keyCombo
            }</span>`,
            `<span
                  class="sptmninja_pallete_row_main_col ${
                    selectedItemIndex === index
                      ? 'sptmninja_weight_bold'
                      : 'sptmninja_muted_result'
                  }"
                  ${selectedItemIndex === index ? 'data-selected' : ''}
                  >
                  <div class="palette_row_description">${
                    command.description
                  }</div>
                  ${
                    lastCommandThatRan === command
                      ? "<div class='palette_row_recently_used'>recently used</div>"
                      : ''
                  }
                </span>`,
            selectedItemIndex === index
              ? utils.createElement('⏎', 'muted_text')
              : '',
          ])
        )
      : '';

    function isResultLineVisible(lineEl) {
      const lineBounds = lineEl.getBoundingClientRect();
      const resultsBounds = shadowDOM
        .get()
        .querySelector('.sptmninja_results')
        .getBoundingClientRect();
      return (
        lineBounds.y > resultsBounds.y &&
        lineBounds.bottom < resultsBounds.bottom
      );
    }

    const selectedLineTr = shadowDOM.get().querySelector('[data-selected]');
    if (selectedLineTr) {
      const selectedLine = selectedLineTr.parentNode.parentNode;
      if (!isResultLineVisible(selectedLine)) {
        selectedLine.scrollIntoView(scrollAlignToTop);
      }
      // unsafeWindow.shadow = shadowDOM.get();
    }
  }

  input.addEventListener('keydown', e => {
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
    } else {
      renderResults();
    }
  });

  input.addEventListener('keyup', e => {
    updateRelevantResults();
    if (selectedItemIndex >= relevantCommands.length) {
      selectedItemIndex = Math.max(relevantCommands.length - 1, 0);
    }
    if (e.keyCode !== 38 && e.keyCode !== 40) {
      renderResults();
    }
  });
}

export { show };
