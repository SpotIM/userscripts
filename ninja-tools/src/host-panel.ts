import * as message from './message';
import * as utils from './utils';
import * as shadowDOM from './shadow-dom';
import colors from './colors';
import gutterActions from './gutter-actions';

let windowRef;
let lastUrl;

export function openCredentialsForm(isOpeningHostPanel?: boolean) {
  const [renderButtons, addListeners] = gutterActions([
    'Delete Credentials',
    'Cancel',
    'Submit',
  ]);

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

  const title = isOpeningHostPanel
    ? 'Your host panel credentials are required.'
    : 'Enter your host panel credentials:';

  message.set(
    /*html*/ `
      <form style="${styles.wrapper}">
        <div style="${styles.title}">${title}</div>
        <div style="${styles.formField}">
          <label style="${styles.label}">Email</label>
          <input id="emailInput" class="sptmninja_input" >
        </div>
        <div style="${styles.formField}">
          <label style="${styles.label}">Password</label>
          <input id="passwordInput" class="sptmninja_input" type="password">
        </div>
        <div style="${styles.disclaimer}">
          If you're using Google to sign to the Host Panel this won't work.
          You'll have to create an account using your email address to use
          this feature.
        </div>
        <input style="${styles.submit}" type="submit"/>
      </form>
    ${renderButtons()}
  `,
    { title: 'Open Host Panel', color: colors.default }
  );

  async function submitForm() {
    const email = shadowDOM
      .get()
      .querySelector('#emailInput')
      .value.trim();
    const password = shadowDOM
      .get()
      .querySelector('#passwordInput')
      .value.trim();

    if (email && password) {
      await GM_setValue('email', email);
      await GM_setValue('password', password);

      message.set('Your credentials were set!', {
        timeout: 2000,
        color: colors.success,
        emoji: '😃',
      });

      if (isOpeningHostPanel) {
        setTimeout(() => {
          open({ spotId: utils.getSpotId(utils.getLauncherEl()) });
        }, 2000);
      }
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
        color: colors.default,
        emoji: '👍🏻',
      });
    }
  }

  // if i don't use setTimeout here the form gets submitted on mount...
  //
  setTimeout(() => {
    shadowDOM
      .get()
      .querySelector('#emailInput')
      .focus();
  }, 10);

  shadowDOM
    .get()
    .querySelector('form')
    .addEventListener('submit', e => {
      e.preventDefault();
      submitForm();
    });

  addListeners(handleButtonClick);
}

export const open = async ({ spotId }: { spotId: string }) => {
  function showSuccessMessage() {
    message.set('Openning Host Panel...', {
      color: colors.success,
      timeout: 2000,
    });
  }

  if (lastUrl) {
    windowRef = window.open(lastUrl);
    lastUrl = null;

    showSuccessMessage();
  }

  if (windowRef && !windowRef.closed) {
    windowRef.focus();
    return;
  }

  const email = await GM_getValue('email');
  const password = await GM_getValue('password');

  if (!email || !password) {
    openCredentialsForm(true);

    return;
  }

  var networkName = 'spotim';

  message.set('Fetching network id...', {
    color: colors.default,
    step: 0,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var networkIdJson = await fetch(
    `https://www.spot.im/api/me/network-id-by-name/${networkName}`
  ).then(r => r.json());

  message.set('Fetching network token...', {
    color: colors.default,
    step: 1,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var networkTokenJson = await fetch(
    `https://www.spot.im/api/me/network-token/${networkIdJson.network_id}`,
    { method: 'post' }
  ).then(r => r.json());

  message.set('Logging in...', {
    color: colors.default,
    step: 2,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var emailConnectJson = await fetch(
    `https://www.spot.im/api/email-connect/login`,
    {
      method: 'post',
      headers: new Headers({
        'x-spotim-networkid': networkIdJson.network_id,
        'x-spotim-token': networkTokenJson.token,
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ email, password }),
    }
  ).then(r => r.json());

  if (emailConnectJson.type === 'EmailLogin_TooManyLoginAttemptsError') {
    message.set('Too many login attempts', {
      color: colors.error,
      timeout: 3500,
      emoji: '😕',
    });
    return;
  } else if (emailConnectJson.success === false) {
    message.set("Couldn't log in to Host Panel", {
      color: colors.error,
      timeout: 3500,
      emoji: '😕',
    });
    return;
  }

  message.set('Fetching login json...', {
    color: colors.default,
    step: 3,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var loginRegisteredJson = await fetch(
    `https://www.spot.im/api/me/login-registered`,
    {
      method: 'post',
      headers: new Headers({
        'x-spotim-networkid': networkIdJson.network_id,
        'x-spotim-token': networkTokenJson.token,
      }),
    }
  ).then(r => r.json());

  message.set('Calling me-make-admin...', {
    color: colors.default,
    step: 4,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var makeMeAdminJson = await fetch(
    `https://www.spot.im/api/moderation/internal/make-me-admin?spot_id=${spotId}`,
    {
      headers: new Headers({
        'x-spotim-networkid': networkIdJson.network_id,
        'x-spotim-token': networkTokenJson.token,
      }),
    }
  ).then(r => r.json());

  message.set('Fetching token JSON...', {
    color: colors.default,
    step: 5,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  var tokenByTicketJson = await fetch(
    `https://www.spot.im/api/me/token-by-ticket/${makeMeAdminJson.token_ticket}`,
    { method: 'post' }
  ).then(r => r.json());

  const isStaging = !utils.isProduction(utils.getLauncherEl());
  var hostPrefix = isStaging ? 'staging-' : '';

  const url = [
    `https://admin.${hostPrefix}spot.im/spot/${spotId}/moderation?`,
    `name=${makeMeAdminJson.spot_name}&`,
    `token=${tokenByTicketJson.token}&`,
    `network_name=${tokenByTicketJson.network_name}`,
  ].join('');

  message.set('Opening Host Panel', {
    color: colors.success,
    timeout: 2000,
    emoji: '😃',
  });

  // windowRef = window.open(url);
  GM_openInTab(url, false);

  // if (windowRef === null) {
  //   message.set(
  //     "Popup blocker probably blocked us<br/>But run the command again and it will work immediately!",
  //     { timeout: 8000, color: colors.error, emoji: "😞" }
  //   );
  //   lastUrl = url;
  // }
};
