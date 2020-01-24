import * as message from './message';
import * as utils from './utils';
import colors from './colors';

let windowRef;
let lastUrl;

export const open = async ({ spotId }) => {
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
    message.set(
      "First you need to enter you're credentials for the Host Panel.<br/>" +
        'Do so by running the following command in the console:<br/>' +
        '<span class="sptmninja_code">__spotim_ninja_tools_set_creds__("john@example.com", "Password!123")</span><br/>' +
        "Note that the credentials will be saved as clear text somewhere in TamperMonkey's storage!",
      { color: colors.default }
    );

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
      timeout: 2000,
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
