import * as message from './message';
import * as utils from './utils';
import * as shadowDOM from './shadow-dom';
import getColors from './colors';
import gutterActions from './gutter-actions';
import rawCSS from './ab-test.css';

export function openModifyForm() {
  const [renderButtons, addListeners] = gutterActions(['Cancel', 'Ok']);

  const styles = {
    wrapper: `
      margin: 1em 2em 1.5em;
    `,
    title: `
      font-weight: normal;
      margin: 1em 0px;
      text-align: left;
    `,
    formField: `
      display: flex;
      align-items: baseline;
      margin: 1em 3em;
    `,
    label: `
      margin-right: 1em;
      width: 120px;
      text-align: right;
    `,
    disclaimer: `
      text-align: left;
      font-size: 0.8em;
      font-weight: normal;
      opacity: 0.8;
    `,
    submit: `
      position: absolute;
      visibility: hidden
    `,
  };

  message.set(
    /*html*/ `
      <style>${rawCSS}</style>
      <form class="abTestFormWrapper">
        <div class="formField">
          <label class="label">Test Id</label>
          <input id="emailInput" class="input" >
        </div>
        <div class="formField">
          <label class="label">Variant</label>
          <input id="passwordInput" class="input" type="password">
        </div>
        <input class="submit" type="submit"/>
      </form>
    ${renderButtons()}
  `,
    {
      title: 'Modify A/B Test',
      color: getColors().default,
    }
  );

  async function submitForm() {
    const email = shadowDOM
      .get()
      .querySelector<HTMLInputElement>('#emailInput')!
      .value.trim();
    const password = shadowDOM
      .get()
      .querySelector<HTMLInputElement>('#passwordInput')!
      .value.trim();

    if (email && password) {
      await GM_setValue('email', email);
      await GM_setValue('password', password);

      message.set('Your credentials were set!', {
        timeout: 2000,
        color: getColors().success,
        emoji: '😃',
      });
    }
  }

  async function handleButtonClick(index: number) {
    if (index === 2) {
      submitForm();
    } else if (index === 1) {
      message.hide(true);
    } else {
      await GM_setValue('email', '');
      await GM_setValue('password', '');
      message.set('Your credentials were deleted!', {
        timeout: 3000,
        color: getColors().default,
        emoji: '👍🏻',
      });
    }
  }

  // if i don't use setTimeout here the form gets submitted on mount...
  //
  setTimeout(() => {
    shadowDOM
      .get()
      .querySelector<HTMLInputElement>('#emailInput')!
      .focus();
  }, 10);

  shadowDOM
    .get()
    .querySelector('form')!
    .addEventListener('submit', e => {
      e.preventDefault();
      submitForm();
    });

  addListeners(handleButtonClick);
}
