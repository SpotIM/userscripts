import * as commandPalette from './command-palette';
import spotsData from './spot-data.json';
import * as message from './message';
import getColors from './colors';
import * as hostPanel from './host-panel';

function gmFetchJson(url: string) {
  return new Promise(resolve => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      onload: function(response) {
        resolve(JSON.parse(response.responseText));
      },
    });
  });
}

export function showSpotCommands({ id }) {
  const { url, spotName } = (() => {
    const spot = spotsData.find(spot => spot.id === id);
    const url = spot?.website_url;
    const name = spot?.name;

    if (!url) {
      return {};
    }

    return {
      url: url.startsWith('http') ? url : `http://${url}`,
      spotName: name,
    };
  })();

  const spotCommands = {
    openSite: () => {
      if (!url) {
        message.set('Spot does not have a website assigned to it.', {
          color: getColors().error,
          emoji: '🤷🏻‍♂️',
        });

        return;
      }

      GM_openInTab(url, false);
    },
    copySpotId: () => {
      GM_setClipboard(id);

      message.set(`Copied ${id} to clipboard!`, {
        timeout: 2000,
        color: getColors().default,
        emoji: '😃',
      });
    },
    openHostPanel: () => {
      hostPanel.open({ spotId: id });
    },
    openPost: async () => {
      message.set('Fetching post URLs', {
        color: getColors().default,
        emoji: '⏳',
        progressBarDuration: 1000,
      });

      try {
        const posts = await gmFetchJson(
          'https://extract-article-links.dutzi.now.sh/?url=' + url
        );

        if (!posts.length) {
          message.set('Could not find any post.', {
            color: getColors().error,
            emoji: '😔',
            timeout: 4000,
          });

          return;
        }

        GM_openInTab(posts[0].url, false);

        message.hide();
      } catch (err) {
        message.set(
          "This is probably due to this site's limitations,<br/>try running the command again from a different website.",
          {
            title: 'Could not fetch post URLs',
            styleAsMessageBox: true,
            color: getColors().error,
            emoji: '😔',
            timeout: 8000,
          }
        );
      }
      // commandPalette.show(
      //   posts.map(post => ({ id: post.url, description: post.textContent })),
      //   command => () => {
      //     GM_openInTab(command.id, false);
      //   },
      //   false
      // );
    },
  };

  function getCommandImpl({ id }: { id: string }) {
    return spotCommands[id];
  }

  return () => {
    commandPalette.show({
      commands: [
        { id: 'openSite', description: 'Open Website' },
        { id: 'openPost', description: 'Open Post Page 🧪' },
        { id: 'copySpotId', description: 'Copy Spot Id' },
        { id: 'openHostPanel', description: 'Open Host Panel' },
      ],
      placeholder: `Type a Command for ${spotName}...`,
      getCommandImpl: getCommandImpl,
      commandPaletteId: 'spotCommands',
    });
  };
}

export function showPalette() {
  commandPalette.show({
    commands: spotsData,
    getCommandImpl: showSpotCommands,
    commandPaletteId: 'spotSelector',
    placeholder: "Type a Spot's Name...",
  });
}
