import { createWriteStream, WriteStream } from "fs";
import { updateComponents, serverOptions } from "./serve";
import { timestamp, Length } from "termx";

const { cyan, yellow } = require('chalk');
const stripAnsi = require('strip-ansi');
const MAX_LOG_STACK = 20;

export var logs = "";
export var logStack: string[] = [];

var outputFile: string;
var outputStream: WriteStream;
var originalWrite = process.stdout.write;
var isLocked = true;


export async function Init () {
    outputFile = serverOptions.config.log;
    outputStream = createWriteStream(outputFile);
}


// Stdout acts as normal
export function restore () {
    if(isLocked) return;

    isLocked = true;
    process.stdout.write = originalWrite;
}

// Stdout is redirected to file and info is managed here
export function hook () {
    if(!isLocked) return;

    isLocked = false;
    (<any>process.stdout).write = function (buffer: string | Uint8Array, cb?: (err?: Error) => void): boolean {
        //? Detecting console log line
            const stack = new Error().stack;
            const [ , file, line, col ] = / \((.+):(.+):(.+)\)/.exec(stack.split("\n")[4]) ?? [, "?","?","?"]
        //? Stilying and printing
            const text = buffer.toString();
            const textToWrite = `${timestamp()} ${text.endsWith("\n"), text.substring(0, text.length - 1)}\n`
            // var location = `${cyan(file)}:${yellow(line)}:${yellow(col)}`
            //     location = location.padStart(process.stdout.columns - 4 - Length(textToWrite), " ") + "\n"


            // addLinesToLog(textToWrite, location);
            // process.nextTick(() =>  { updateComponents("logs") })

        //? Write data to output file
            outputStream.write(stripAnsi(textToWrite), cb);
        return true;
    }
}

function addLinesToLog (text: string, location: string) {
    const lines = text.split("\n");

    lines[lines.length - 1] = lines[lines.length - 1] + location.padStart(process.stdout.columns - Length(lines[lines.length - 1]), " ");

    for(let line of lines) {
        logStack.push(line + "\n");
    }
        
    if(logStack.length >= MAX_LOG_STACK) {
        logStack = logStack.slice(logStack.length - MAX_LOG_STACK + 1, logStack.length)
    }

    logs = logStack.join('');
}