![Spot.IM Ninja Tools Logo](./header.png)

## A Bit of History

This project started as a single module with HTML and CSS embedded within the code, as it passed the ~1000 LOCs I decided to add Webpack and re-organize everything. I also started using Shadow DOM much later than I should have.

I haven't had the time to fully refactor everything, so in a lot of places you will still see CSS within the code and "manually namespaced" class names and CSS properties that are only there to override common ones I saw in publisher's pages. Sorry for that.

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

After you're done developing, re-install [the script from Github](https://github.com/SpotIM/userscripts/raw/master/spotim-ninja-tools.user.js).

## Adding a Command

To add a new command, you need to edit two files.

- [commands.ts](./src/commands.ts) - This is where you'll provide the metadata for the command:
  - `id` (string) - A unique identifier.
  - `keyCombo` (string, optional) - The key combination that activates this command (you can hit a key combo without the need to open the command palette), use this one for _super_ useful commands.
  - `description` (string) - The command's description, shows up in the command palette and help screen.
  - `detailedDescription` (string, optional) - A detailed description that will only show up in the help screen.
- [commands-impl.ts](./src/commands-impl.ts) - This file exports an object where the keys are command ids and the values are that command's implementation. Nearing the end of that file you'll see a block that automatically creates command entries for A/B test commands.

## Adding an A/B Test

To add a command that toggles A/B tests (or cycles between their variants) there's no need to edit [commands.ts](./src/commands.ts) or [commands-impl.ts](./src/commands-impl.ts), instead you use a simple abstraction above it. You describe what your A/B test tests for and those descriptions are automatically converted to commands.

Open [ab-test-commands.ts](./src/ab-test-commands.ts) and add an A/B test. It's pretty straightforward, just look at existing ones for reference.

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
