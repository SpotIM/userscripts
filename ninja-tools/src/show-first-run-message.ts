import * as prefs from './prefs';
import * as message from './message';
import colors from './colors';
import * as whatsNew from './whats-new';

function renderWelcomeMessage() {
  return /*html*/ `
    <style>
      @keyframes cta {
        0% {
          color: #ffffff;
          text-shadow: inherit;
        }
        74.99% {
          color: #ffffff;
          text-shadow: inherit;
        }
        75% {
          color: transparent;
          text-shadow: none;
        }
        100% {
          color: transparent;
          text-shadow: none;
        }
      }
      .wrapper {
        margin: -7px -10px -18px;
      }

      .wrapper img {
        width: 100%;
        height: 294px;
      }

      .message {
        text-align: left;
        padding: 20px;
        margin-bottom: -80px;
      }

      .message p:first-child {
        margin-top: 0px;
      }

      .shortcut {
        background: #FF37FD;
        padding: 6px 8px;
        border-radius: 5px;
        box-shadow: 0px 0px 2px #000000a8;
      }

      .cta {
        animation: cta linear 1.4s infinite;
      }
    </style>
    <div class="wrapper">
      <div class="message">
        <p>👋 Welcome,</p>
        <p>You can now hit <span class="shortcut">Ctrl+S</span> to open the command palette.</p>
        <p class="cta">Press Ctrl+S</p>
      </div>
      <img src="https://github.com/SpotIM/userscripts/raw/master/ninja-tools/welcome-background.png">
    </div>
  `;
}

export default async () => {
  const isNotFirstRun = await prefs.get().isNotFirstRun;
  if (!isNotFirstRun) {
    message.set(renderWelcomeMessage(), {
      color: colors.default,
      title: 'Welcome to Spot.IM Ninja Tools!',
    });

    await prefs.set({ isNotFirstRun: true });
    await whatsNew.setCurrentVersionAsLastShown();
  }
};
