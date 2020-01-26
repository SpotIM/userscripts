![Spot.IM Ninja Tools Logo](./header.png)

## Develop

Run:

```
yarn start
```

Then visit http://localhost:5732/spotim-ninja-tools.user.js and install the script.

Whenever you make changes to the source, update the userscript through Tampermonkey.

After you're done developing, re-install the script from [Github](https://github.com/SpotIM/userscripts/raw/master/spotim-ninja-tools.user.js).

## Publish

Bump version in `package.json` and run:

```
yarn build
```

And just push the changes (Tampermonkey pulls updates from this repo on a daily basis).
