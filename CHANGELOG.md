# Changelog

## 0.4.0 — 2014-09-xx
- xtc install now creates symlink from project's node modules to xtc's node_modules, so Yeoman can find it.
- xtc build accepts two new options `--verbose` and `--debug` which are passed to Grunt.
- xtc start: xtc start: remove redundant arg to node spawn call

## 0.3.0 — 2014-09-09
- New command `xtc doctor` checks and if needed attempts to fix the project setup. Currently fixes broken or missing symlink to generator-xtc.
- Re-implemented and expanded generator-xtc symlinking code in xtc-cli.
- New command `xtc ls`. Lists versions published to npm.
- `xtc mkmod [name]` and `xtc mkskin [name]`. A name argument can now be passed to the generator.

## 0.2.2 — 2014-06-13
- Fix issue #1 (install fails with `config is not defined`)

## 0.2.1 — 2014-06-11
- Fix showing `xtc start` hint after project setup, for default setups.

## 0.2.0 — 2014-06-04
- Stores source of xtc installation in xtcfile.json
- `xtc info` displays source of xtc installation
- Installing develop branch now uses URI for a tarball instead of git. Fixes 'invalid tar file" issue on Windows
- Install pre-set project dependencies (after installing xtc, generator-xtc's dependencies and project setup). Some modules (e.g. Hipsum.js) are now installed at the project-level and can be changed by the user.

## 0.1.0 — 2014-04-28
- Add a changelog
- New option: xtc start --port|-p [number]
- Commands that require local xtc install exit if xtc is not found
- Refactored all async execution to use promises.
- `xtc help command` now works.
- Better error handling
- Windows compatibility (with help from [superspawn](https://github.com/MarcDiethelm/superspawn))
