import * as message from './message';
import * as utils from './utils';
import commands from './commands';
import getColors from './colors';

export const show = () => {
  message.set(
    utils.renderTable(
      [
        { keyCombo: 'ctrl+s', description: 'Open Command Palette' },
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
                    sptmninja_mono
                    ${command.unlisted ? 'sptmninja_hidden' : ''}
                  ">
                  ${command.unlisted ? '×' : command.keyCombo}
                </span>`,
        command.description +
          (command.detailedDescription
            ? `<div class="sptmninja_detailed_description">${command.detailedDescription}</div>`
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
