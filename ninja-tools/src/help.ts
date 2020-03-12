import * as message from './message';
import * as utils from './utils';
import commands from './commands';
import getColors from './colors';

export const show = () => {
  message.set(
    utils.renderTable(
      [
        {
          keyCombo: utils.isWindows
            ? 'alt+s'
            : '<span class="modifier-key">⌃</span>s',
          description: 'Open Command Palette',
        },
        {
          keyCombo: utils.isWindows
            ? 'alt+<span class="modifier-key">⇧</span>+s'
            : '<span class="modifier-key">⌃⇧</span>s',
          description: 'Open Spots List',
        },
        ...commands,
        { keyCombo: 'escape', description: 'Hide Floating Message' },
      ].map(command => [
        `<span
          title="${
            !command.keyCombo ? 'This has no key combo assigned to it' : ''
          }"
          class="
            mono
            ${!command.keyCombo ? 'hidden' : ''}
          ">
          ${!command.keyCombo ? '×' : command.keyCombo}
        </span>`,
        command.description +
          (command.detailedDescription
            ? `<div class="detailed_description">${command.detailedDescription}</div>`
            : ''),
      ])
    ),
    {
      color: getColors().default,
      title: 'Available Commands',
      overflow: 'scroll',
    }
  );
};
