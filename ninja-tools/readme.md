![Spot.IM Ninja Tools Logo](./header.png)

## Develop

Run:

```
yarn start
```

Then visit http://localhost:5732/spotim-ninja-tools.user.js and install the script.

In most domains you'll see the following repeatedly spat out to the console:

```
Invalid Host/Origin header
[WDS] Disconnected!
```

Ignore it.

Whenever you make changes to the source, update the userscript through Tampermonkey.

After you're done developing, re-install the script from [Github](https://github.com/SpotIM/userscripts/raw/master/spotim-ninja-tools.user.js).

## Adding a Command

To add a new command, you need to edit two files.

- [commands.ts](./src/commands.ts) - This is where you'll provide the metadata for the command:
  - `keyCombo` (string) - The key combination that activates this command (you can hit a key combo without the need to open the command palette), use this one for _super_ useful commands. If you don't want a key combo for that command, you'll still have to define one **(a unique one)** since it's also used as the command's identifier. If that's the case please the following as a template for one: `__ssXX` where XX are some group of chars that describe it.
  - `description` (string) - The command's description, shows up in the command palette and help screen.
  - `detailedDescription` (string) - A detailed description that will only show up in the help screen.
  - `unlisted` (boolean) - Set to false if the key combo starts with `__` (TODO - remove this, have it derived automatically from key combo).
- [commands-impl.ts](./src/commands-impl.ts) - This file exports an object where the keys are key combo (remember they are used as identifiers?) and the values are that command's implementation.

## Adding an A/B Test

To add a command that toggles A/B tests (or cycles between their variants) there's no need to edit [commands.ts](./src/commands.ts) or [commands-impl.ts](./src/commands-impl.ts), instead you use a simple abstraction above it. You describe what your A/B test tests for and those descriptions are automatically converted to commands.

Open [ab-test-commands.ts](./src/ab-test-commands.ts) and add an A/B test. It's pretty straightforward, just Look at existing ones for reference.

## Updating the Release Notes (or What's New)

We don't want people using this userscript to be constantly bombarded with "What's New" screens.

When releasing small updates (i.e., ones that fix some bugs or makes some minor change) please refrain from updating the [release notes](./src/whats-new.ts).

When making big, front facing changes, ones that are reflected in the UI (i.e., adding commands) add a short, one line release note.

Let's keep this userscript as frictionless as possible from the user's point of view.

## Publish

Bump version in `package.json` and run:

```
yarn build
```

And just push the changes (Tampermonkey pulls updates from this repo on a daily basis).
