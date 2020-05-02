var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const serve_1 = require("./serve");
const termx_1 = require("termx");
const { cyan, yellow } = require('chalk');
const stripAnsi = require('strip-ansi');
const MAX_LOG_STACK = 20;
exports.logs = "";
exports.logStack = [];
var outputFile;
var outputStream;
var originalWrite = process.stdout.write;
var isLocked = true;
function Init() {
    return __awaiter(this, void 0, void 0, function* () {
        outputFile = serve_1.serverOptions.config.log;
        outputStream = fs_1.createWriteStream(outputFile);
    });
}
exports.Init = Init;
// Stdout acts as normal
function restore() {
    if (isLocked)
        return;
    isLocked = true;
    process.stdout.write = originalWrite;
}
exports.restore = restore;
// Stdout is redirected to file and info is managed here
function hook() {
    if (!isLocked)
        return;
    isLocked = false;
    process.stdout.write = function (buffer, cb) {
        var _a;
        //? Detecting console log line
        const stack = new Error().stack;
        const [, file, line, col] = (_a = / \((.+):(.+):(.+)\)/.exec(stack.split("\n")[4])) !== null && _a !== void 0 ? _a : [, "?", "?", "?"];
        //? Stilying and printing
        const text = buffer.toString();
        const textToWrite = `${termx_1.timestamp()} ${text.endsWith("\n"), text.substring(0, text.length - 1)}\n`;
        // var location = `${cyan(file)}:${yellow(line)}:${yellow(col)}`
        //     location = location.padStart(process.stdout.columns - 4 - Length(textToWrite), " ") + "\n"
        // addLinesToLog(textToWrite, location);
        // process.nextTick(() =>  { updateComponents("logs") })
        //? Write data to output file
        outputStream.write(stripAnsi(textToWrite), cb);
        return true;
    };
}
exports.hook = hook;
function addLinesToLog(text, location) {
    const lines = text.split("\n");
    lines[lines.length - 1] = lines[lines.length - 1] + location.padStart(process.stdout.columns - termx_1.Length(lines[lines.length - 1]), " ");
    for (let line of lines) {
        exports.logStack.push(line + "\n");
    }
    if (exports.logStack.length >= MAX_LOG_STACK) {
        exports.logStack = exports.logStack.slice(exports.logStack.length - MAX_LOG_STACK + 1, exports.logStack.length);
    }
    exports.logs = exports.logStack.join('');
}
