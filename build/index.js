#!/usr/bin/env node
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Commands = __importStar(require("./commands"));
const cli = require("commander");
{ //? @note (Index) Configure CLI
    cli.version('1.0.0')
        .option('-d, --debug', 'Starts a Debugger CLI')
        .option('-p, --port <port>', 'Set port')
        .option('-m, --module <filename>', 'Set module to export')
        .option('-l, --log <port>', 'Opens a tcp log server.')
        .option('-c, --config <file>', 'Uses a configuration file.')
        .option('-n, --node', 'Sets up the connecting node')
        .action((cmd, ...args) => Commands[cmd] && Commands[cmd](...args));
    cli.parse(process.argv);
}
process.on('uncaughtException', (exc) => console.log({ UNCAUGHT_EXCEPTION: exc }));
