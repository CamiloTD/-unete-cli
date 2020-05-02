import net from "net";
import repl from "repl";
import path from "path";
import YAML from 'yamljs';
import https from 'https';
import Storage from '../storage';
import { log, danger, cold, highlight, warning } from "termx";
import readline from "readline-sync";
import { Socket as Sock, Server } from "@unete/io";
import Chalk from "chalk";

const { toArray } = require('rxjs/operators');

{//? @note REGEX
    var REGEX_ASSIGNMENT = /^\$\.([^(]+)=(.+)$/;
    var REGEX_VALUE = /^(\$\.[^(=]+)$/;
    var REGEX_IS_BLOCKCHAIN_ADDRESS = /^([^@]+)@0x/;
}

export async function connect (url: string, program: any) {
    {//? @note (Connect) Normalize URL
        var protocol;

        protocol = url.substring(0, url.indexOf("://"));

        if(!protocol) {
            protocol = "http"
            url = 'http://' + url;
        }
    }
    
    
    {//? @note (Connect) Define Variables
        var API = Sock(url);
        var store = Storage('env-vars');
        var help: any = {};
        var methods: any;
    }

    {//? @note (Connect) Connect and Fetch Methods
        log(cold(`Connecting to ${url}...`));

        methods = await API.$public().catch((exc: Error) => {
            if(exc.message === "xhr poll error")
                log(danger("💥 Could not connect to the server."));

            process.exit(0);
        })
    }

    var completions: string[] = plainify(methods);

    const r = repl.start({
        prompt: Chalk.hex("#82b6ed")(Chalk.bold(url)) + highlight(' $ '),

        //? @note (Connect) On Command received
        eval: async (cmd, $, filename, cb) => {
            {//? @note (Connect.Eval) Preprocess command & OnHelp
                cmd = cmd.trim();
            }

            try {//? @note (Connect.Eval) Main
                {//? @note (Connect.Eval) On Exit
                    if(cmd === "exit") process.exit(0);
                }

                {//? @note (Connect.Eval) On Help
                    if(cmd === "help") {
                        try {
                            help = await API.$help();
                        } catch (exc) {
                            
                        }

                        log(cold(`Available methods for ${url}:`), helpify(methods, help, "", "", "  "));

                        return cb(null, undefined);
                    }
                }

                {//? @note (Connect.Eval) On local var assignment
                    var match = REGEX_ASSIGNMENT.exec(cmd);
                    
                    if(match) {
                        const val = await eval(`(async () => { return ${match[2]} })()`);
                        
                        $[match[1].trim()] = val;

                        store.set(match[1].trim(), val);
                        
                        cb(null, val);
                        return;
                    }
                }

                {//? @note (Connect.Eval) On Value
                    match = REGEX_VALUE.exec(cmd);

                    if(match) {
                        cb(null, eval(cmd));
                        return;
                    }
                }

                {//? @note (Connect.Eval) On Command
                    let rs = await eval('API.' + cmd);
                    
                    if(rs && typeof rs.pipe === "function") {
                        rs = await rs.pipe(toArray()).toPromise();
                    }

                    cb(null, rs);
                }
            } catch (exc) { //? @note (Connect.Eval) On Error
                if(typeof exc === "object") {
                    if(exc.message) exc = exc.message;
                    else exc = JSON.stringify(exc);
                }

                log(danger(exc));
                cb(null, undefined);
            }
        },

        completer: (line: string) => {
            const hits = completions.filter((c: string) => c.includes(line));

            return [hits.length ? hits : completions, line];
        }
    });

    for(let i in store.data)
        r.context[i] = store.data[i];
}

{//? @note Utility Functions
    var helpify = function (obj: any, help: any, header = "", pre = "", tabs="") {
        let str = cold(header && `+ ${pre + "*"}:`) || "";
        
        for(let i in obj) {
            let fn = obj[i];
            let _help = help && help[i];

            if(typeof fn === "object" && !Array.isArray(fn.arguments) && !Array.isArray(fn))
                str += "\n" + tabs + helpify(fn, _help, i, i + ".", tabs + "  ");
            
            else {
                if(fn.arguments) {
                    let args = fn.arguments.map((x: string) => highlight(x)).join(cold(', '));
                    
                    str += `\n${tabs}${cold('+')} ${cold(pre)}${cold(i)}${cold(`(${args})`)}${_help? `: ${_help.description}`: ""}`;
                } else {
                    let args = Array.isArray(fn)? fn.map((x) => x.magenta).join(cold(', ')) : highlight("...");
        
                    str += `\n${tabs}${cold('+')} ${cold(pre)}${cold(i)}${cold(`(${args})`)}`;
                }
            }
        }

        return str;
    }

    var plainify = function (obj: any, pre="") {
        let x: string[] = [];

        for(let i in obj) {
            let y = obj[i];

            if(typeof y === "object" && !Array.isArray(y) && !Array.isArray(y.arguments))
                x = [
                    ...x,
                    ...plainify(y, pre + i + ".")
                ];
            else
                x.push(pre + i);
        }

        return x;
    }
}