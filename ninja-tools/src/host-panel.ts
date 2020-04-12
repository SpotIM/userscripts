import * as message from './message';
import * as utils from './utils';
import * as shadowDOM from './shadow-dom';
import getColors from './colors';
import gutterActions from './gutter-actions';

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
          <input id="emailInput" class="input" >
        </div>
        <div style="${styles.formField}">
          <label style="${styles.label}">Password</label>
          <input id="passwordInput" class="input" type="password">
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
    {
      title: isOpeningHostPanel
        ? 'Open Host Panel'
        : 'Set Host Panel Credentials',
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
        color: getColors().default,
        emoji: '👍🏻',
      });
    }
  }

  // if i don't use setTimeout here the form gets submitted on mount...
  //
  setTimeout(() => {
    shadowDOM.get().querySelector<HTMLInputElement>('#emailInput')!.focus();
  }, 10);

  shadowDOM
    .get()
    .querySelector('form')!
    .addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });

  addListeners(handleButtonClick);
}

export const open = async ({ spotId }: { spotId: string }) => {
  function showSuccessMessage() {
    message.set('Openning Host Panel...', {
      color: getColors().success,
      timeout: 2000,
    });
  }

  const email = await GM_getValue('email');
  const password = await GM_getValue('password');

  if (!email || !password) {
    openCredentialsForm(true);

    return;
  }

  const networkName = 'spotim';

  message.set('Fetching network id...', {
    color: getColors().default,
    step: 0,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const networkIdJson = await fetch(
    `https://www.spot.im/api/me/network-id-by-name/${networkName}`
  ).then((r) => r.json());

  message.set('Fetching network token...', {
    color: getColors().default,
    step: 1,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const networkTokenJson = await fetch(
    `https://www.spot.im/api/me/network-token/${networkIdJson.network_id}`,
    { method: 'post' }
  ).then((r) => r.json());

  message.set('Logging in...', {
    color: getColors().default,
    step: 2,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const emailConnectJson = await fetch(
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
  ).then((r) => r.json());

  if (emailConnectJson.type === 'EmailLogin_TooManyLoginAttemptsError') {
    message.set('Too many login attempts', {
      color: getColors().error,
      timeout: 3500,
      emoji: '😕',
    });
    return;
  } else if (emailConnectJson.success === false) {
    message.set(
      `Try <a href="#" onclick="
        event.preventDefault();
        __spotimninjatools.updateCredentials()
      ">updating you credentials</a>`,
      {
        title: "Couldn't log in to Host Panel",
        color: getColors().error,
        // timeout: 3500,
        emoji: '😕',
        styleAsMessageBox: true,
      }
    );
    return;
  }

  message.set('Fetching login json...', {
    color: getColors().default,
    step: 3,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const loginRegisteredJson = await fetch(
    `https://www.spot.im/api/me/login-registered`,
    {
      method: 'post',
      headers: new Headers({
        'x-spotim-networkid': networkIdJson.network_id,
        'x-spotim-token': networkTokenJson.token,
      }),
    }
  ).then((r) => r.json());

  message.set('Calling me-make-admin...', {
    color: getColors().default,
    step: 4,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const makeMeAdminJson = await fetch(
    `https://www.spot.im/api/moderation/internal/make-me-admin?spot_id=${spotId}`,
    {
      headers: new Headers({
        'x-spotim-networkid': networkIdJson.network_id,
        'x-spotim-token': networkTokenJson.token,
      }),
    }
  ).then((r) => r.json());

  message.set('Fetching token JSON...', {
    color: getColors().default,
    step: 5,
    numSteps: 5,
    title: 'Open Admin Panel',
  });

  const tokenByTicketJson = await fetch(
    `https://www.spot.im/api/me/token-by-ticket/${makeMeAdminJson.token_ticket}`,
    { method: 'post' }
  ).then((r) => r.json());

  const isStaging = !utils.isProduction(utils.getLauncherEl());
  const hostPrefix = isStaging ? 'staging-' : '';

  const url = [
    `https://admin.${hostPrefix}spot.im/spot/${spotId}/moderation?`,
    `name=${makeMeAdminJson.spot_name}&`,
    `token=${tokenByTicketJson.token}&`,
    `network_name=${tokenByTicketJson.network_name}`,
  ].join('');

  message.set('Opening Host Panel', {
    color: getColors().success,
    timeout: 2000,
    emoji: '😃',
  });

  GM_openInTab(url, false);
};
