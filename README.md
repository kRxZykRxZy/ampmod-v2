# AmpMod

AmpMod is a powerful block-based programming language with things like first-class lists,
making it easier to create larger and more complicated projects.

The project was originally started as UltiBlocks on 2025-02-03.

## Try it

To try AmpMod out, see:

- Production (stable version of AmpMod): https://ampmod.codeberg.page
- Canary (newest commits): https://ampmod.codeberg.page/canary

# AmpMod monorepo

This is the source code for the AmpMod editor.

## Included packages

The following packages are included in this monorepo:

- `gui`: The user interface used to run/create projects.
- `vm`: The package that executes projects and loads extensions.
- `blocks`: The package used for the drag-and-drop block interface.
- `desktop`: The desktop app for AmpMod.
- `paint`: The paint editor for creating costumes and backdrops.
- `render-fonts`: A package that contains fonts used in projects.
- `svg-renderer`: A package for rendering SVG images. Unmodified from TurboWarp; forked due to dependency issues.
- `branding`: Self-explanatory. See [Forking](#forking).

`ampmod-web` uses a multirepo structure (`ampmod-web-front` and `ampmod-web-back`) due to relatively
small size and being almost entirely unrelated to this monorepo's packages.

Most of these packages have been published to our NPM registry (public):
https://codeberg.org/ampmod/-/packages

## Setup

Run `npm i` in the root directory to install all packages needed.

## Forking

Here are some important recommendations for forks. Since AmpMod is free and open-source,wWe don't strictly require
you to follow these.

- Change the branding of your mod. This is perhaps the most important change for a fork. Instead of modifying
  `packages/gui/src/lib/brand.js`, you should modify `packages/branding/src/index.js`. You will especially
  want to change `APP_NAME` and `APP_SOURCE`.
- Create your own accent colour. We recommend using a colour from the Scratch category palette, or at least a colour
  made to look like it. Some other accent colours like `rainbow` and `grey` already exist; you can use those.
- Licencing: Please release your source code. Not doing so is illegal and violates the GPL. However, you _are_ allowed to
  copy the files outside of `packages` and `.woodpecker` as those are under 0BSD.

## Licence

The licence for each package is in their respective folders.

Any files outside of `packages` and `.woodpecker` are under the 0BSD licence.

The `.woodpecker` folder is under the GPL v3.
