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

    help                   Shows this usage information
    info                   Information about the project setup
    start [options]        Starts the xtc server. Use `-p [number]` to force a port.
    build [options]        Start frontend asset build. Use `-d` for production build to dist target.
    mkmod                  Create new Terrific frontend modules
    mkskin                 Create new skins for a Terrific frontend module
    setup                  Launch project setup
    install                Install xtc and set up a project

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```
