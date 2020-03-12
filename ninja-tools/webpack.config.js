const path = require('path');
const WebpackUserscript = require('webpack-userscript');
const dev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    path: path.resolve(__dirname, '../'),
    filename: process.env.BETA
      ? 'spotim-ninja-tools-beta.user.js'
      : 'spotim-ninja-tools.user.js',
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 5732,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: 'raw-loader',
      },
      {
        test: /\.svg$/i,
        use: 'raw-loader',
      },
    ],
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        name: 'SpotIM Ninja Tools',
        namespace: 'https://spot.im/',
        version: dev ? `[version]-build.[buildTime]` : `[version]`,
        description: 'A bunch of shortcuts to make our lives easier',
        author: 'dutzi',
        match: 'http*://*/*',
        noframes: true,
        resource: [
          'bigBlueFont https://rawcdn.githack.com/SpotIM/userscripts/53c2ab94cf3523830e17d299ed8abd533822d0c5/ninja-tools/src/assets/BigBlue_Terminal_437TT.TTF',
          'welcomeImage https://github.com/SpotIM/userscripts/raw/master/ninja-tools/src/assets/welcome-background.png',
        ],
        supportURL: 'slack://channel?id=CSZGJD6R1&team=T0460KVUF',
        connect: ['extract-article-text.dutzi.now.sh'],
        'run-at': 'document-start',
        iconURL:
          'https://rawcdn.githack.com/SpotIM/userscripts/b327b3d46d1c3bf681a56e05b9b88e6bbcc3153e/ninja-tools/icon64.png',
        icon64URL:
          'https://rawcdn.githack.com/SpotIM/userscripts/b327b3d46d1c3bf681a56e05b9b88e6bbcc3153e/ninja-tools/icon64.png',
        grant: [
          'GM_setValue',
          'GM_getValue',
          'GM_openInTab',
          'GM_setClipboard',
          'GM_deleteValue',
          'GM_notification',
          'GM_getResourceURL',
          'GM_xmlhttpRequest',
          'unsafeWindow',
        ],
      },
    }),
  ],
};
