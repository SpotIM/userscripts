import * as message from './message';
import * as utils from './utils';
import commands from './commands';
import getColors from './colors';

export const show = () => {
  message.set(
    utils.renderTable(
      [
        {
          keyCombo: utils.isWindows ? 'alt+s' : 'ctrl+s',
          description: 'Open Command Palette',
        },
        ...commands,
        { keyCombo: 'escape', description: 'Hide Floating Message' },
      ].map(command => [
        `<span
          title="${
            command.unlisted
              ? 'This command is unlisted, no key combo assigned to it'
              : ''
          }"
          class="
            mono
            ${command.unlisted ? 'hidden' : ''}
          ">
          ${command.unlisted ? '×' : command.keyCombo}
        </span>`,
        command.description +
          (command.detailedDescription
            ? `<div class="detailed_description">${command.detailedDescription}</div>`
            : ''),
      ])
    ),
    {
      color: getColors().default,
      title: 'Available Shortcuts',
      overflow: 'scroll',
    }
  );
};
