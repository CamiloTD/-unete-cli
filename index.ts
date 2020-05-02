#!/usr/bin/env node
import * as Commands from './commands';

const cli = require("commander");

{//? @note (Index) Configure CLI
    cli.version('1.0.0')
       .option('-d, --debug', 'Starts a Debugger CLI')
       .option('-p, --port <port>', 'Set port')
       .option('-m, --module <filename>', 'Set module to export')
       .option('-l, --log <port>', 'Opens a tcp log server.')
       .option('-c, --config <file>', 'Uses a configuration file.')
       .option('-n, --node', 'Sets up the connecting node')
       .action((cmd: any, ...args: any) => (Commands as any)[cmd] && (Commands as any)[cmd](...args));

       cli.parse(process.argv)
}

process.on('uncaughtException', (exc) => console.log({ UNCAUGHT_EXCEPTION: exc }));