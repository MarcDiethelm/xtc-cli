![npm version](http://b.adge.me/npm/v/xtc-cli.svg)

xtc-cli
=======

Command line tool for the xtc Frontend framework.

Most commands are interactive.

Installation:

```shell
npm install -g xtc-cli
```

To install xtc and set up a project with generator-xtc. Change to the desired dir.

```shell
xtc install
```

List available commands

```
xtc help
```
outputs this

```shell
  Usage: xtc [options] [command]

  Commands:

    start [options]        Starts the xtc server. Use `-p [number]` to force a port.
    build [options]        Start frontend asset build. Use `-d` for production build to dist target.
    mkmod                  Create new Terrific frontend modules
    mkskin                 Create new skins for a Terrific frontend module
    install                Install xtc and launch project setup
    setup                  Launch project setup
    info                   Information about the project setup
    ls                     List xtc versions published to npm
    doctor                 Check project setup, attempts fix if needed
    help [command]         Show usage information

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```
