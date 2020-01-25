import * as shadowDOM from './shadow-dom';

export default function gutterActions(
  buttons: string[]
): [() => string, (callback: (index: number) => void) => void] {
  function renderButtons() {
    return /*html*/ `
        <div class="gutterActions">
        ${buttons
          .map(
            (label, index) => /*html*/ `
          <button class="gutterActionsButton" id="gutterButton${index}">
            ${label}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  function addListeners(onClick: (index: number) => void) {
    buttons.forEach((label, index) => {
      shadowDOM
        .get()
        .querySelector(`#gutterButton${index}`)
        ?.addEventListener('click', onClick.bind(null, index));
    });
  }

  return [renderButtons, addListeners];
}
