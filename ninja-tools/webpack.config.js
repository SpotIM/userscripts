const path = require('path');
const WebpackUserscript = require('webpack-userscript');
const dev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.ts'),
  output: {
    path: path.resolve(__dirname, '../'),
    filename: 'spotim-ninja-tools.user.js',
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
        grant: [
          'GM_setValue',
          'GM_getValue',
          'GM_openInTab',
          'GM_setClipboard',
          'GM_deleteValue',
          'GM_notification',
          'unsafeWindow',
        ],
      },
    }),
  ],
};
