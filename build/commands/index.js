var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const repl_1 = __importDefault(require("repl"));
const storage_1 = __importDefault(require("../storage"));
const termx_1 = require("termx");
const io_1 = require("@unete/io");
const chalk_1 = __importDefault(require("chalk"));
const server_1 = require("../server");
const terminal_kit_1 = require("terminal-kit");
const Templates = __importStar(require("../init/templates"));
const { toArray } = require('rxjs/operators');
{ //? @note REGEX
    var REGEX_ASSIGNMENT = /^\$\.([^(]+)=(.+)$/;
    var REGEX_VALUE = /^(\$\.[^(=]+)$/;
    var REGEX_IS_BLOCKCHAIN_ADDRESS = /^([^@]+)@0x/;
}
function connect(url, program) {
    return __awaiter(this, void 0, void 0, function* () {
        { //? @note (Connect) Normalize URL
            var protocol;
            protocol = url.substring(0, url.indexOf("://"));
            if (!protocol) {
                protocol = "http";
                url = 'http://' + url;
            }
        }
        { //? @note (Connect) Define Variables
            var API = io_1.Socket(url);
            var store = storage_1.default('env-vars');
            var help = {};
            var methods;
        }
        { //? @note (Connect) Connect and Fetch Methods
            termx_1.log(termx_1.cold(`Connecting to ${url}...`));
            methods = yield API.$public().catch((exc) => {
                if (exc.message === "xhr poll error")
                    termx_1.log(termx_1.danger("💥 Could not connect to the server."));
                process.exit(0);
            });
        }
        var completions = plainify(methods);
        const r = repl_1.default.start({
            prompt: chalk_1.default.hex("#82b6ed")(chalk_1.default.bold(url)) + termx_1.highlight(' $ '),
            //? @note (Connect) On Command received
            eval: (cmd, $, filename, cb) => __awaiter(this, void 0, void 0, function* () {
                { //? @note (Connect.Eval) Preprocess command & OnHelp
                    cmd = cmd.trim();
                }
                try { //? @note (Connect.Eval) Main
                    { //? @note (Connect.Eval) On Exit
                        if (cmd === "exit")
                            process.exit(0);
                    }
                    { //? @note (Connect.Eval) On Help
                        if (cmd === "help") {
                            try {
                                help = yield API.$help();
                            }
                            catch (exc) {
                            }
                            termx_1.log(termx_1.cold(`Available methods for ${url}:`), helpify(methods, help, "", "", "  "));
                            return cb(null, undefined);
                        }
                    }
                    { //? @note (Connect.Eval) On local var assignment
                        var match = REGEX_ASSIGNMENT.exec(cmd);
                        if (match) {
                            const val = yield eval(`(async () => { return ${match[2]} })()`);
                            $[match[1].trim()] = val;
                            store.set(match[1].trim(), val);
                            cb(null, val);
                            return;
                        }
                    }
                    { //? @note (Connect.Eval) On Value
                        match = REGEX_VALUE.exec(cmd);
                        if (match) {
                            cb(null, eval(cmd));
                            return;
                        }
                    }
                    { //? @note (Connect.Eval) On Command
                        let rs = yield eval('API.' + cmd);
                        if (rs && typeof rs.pipe === "function") {
                            rs = yield rs.pipe(toArray()).toPromise();
                        }
                        cb(null, rs);
                    }
                }
                catch (exc) { //? @note (Connect.Eval) On Error
                    if (typeof exc === "object") {
                        if (exc.message)
                            exc = exc.message;
                        else
                            exc = JSON.stringify(exc);
                    }
                    termx_1.log(termx_1.danger(exc));
                    cb(null, undefined);
                }
            }),
            completer: (line) => {
                const hits = completions.filter((c) => c.includes(line));
                return [hits.length ? hits : completions, line];
            }
        });
        for (let i in store.data)
            r.context[i] = store.data[i];
    });
}
exports.connect = connect;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        terminal_kit_1.terminal.cyan("Which template do you want to use?");
        terminal_kit_1.terminal.singleColumnMenu(["Typescript", "Javascript"], {}, (err, response) => __awaiter(this, void 0, void 0, function* () {
            const selectedLanguage = response.selectedText;
            switch (selectedLanguage) {
                case "Typescript":
                    yield Templates.Typescript();
                    break;
                case "Javascript":
                    yield Templates.Javascript();
                    break;
            }
        }));
    });
}
exports.init = init;
exports.serve = server_1.serve;
exports.s = server_1.serve;
exports.c = connect;
{ //? @note Utility Functions
    var helpify = function (obj, help, header = "", pre = "", tabs = "") {
        let str = termx_1.cold(header && `+ ${pre + "*"}:`) || "";
        for (let i in obj) {
            let fn = obj[i];
            let _help = help && help[i];
            if (typeof fn === "object" && !Array.isArray(fn.arguments) && !Array.isArray(fn))
                str += "\n" + tabs + helpify(fn, _help, i, i + ".", tabs + "  ");
            else {
                if (fn.arguments) {
                    let args = fn.arguments.map((x) => termx_1.highlight(x)).join(termx_1.cold(', '));
                    str += `\n${tabs}${termx_1.cold('+')} ${termx_1.cold(pre)}${termx_1.cold(i)}${termx_1.cold(`(${args})`)}${_help ? `: ${_help.description}` : ""}`;
                }
                else {
                    let args = Array.isArray(fn) ? fn.map((x) => x.magenta).join(termx_1.cold(', ')) : termx_1.highlight("...");
                    str += `\n${tabs}${termx_1.cold('+')} ${termx_1.cold(pre)}${termx_1.cold(i)}${termx_1.cold(`(${args})`)}`;
                }
            }
        }
        return str;
    };
    var plainify = function (obj, pre = "") {
        let x = [];
        for (let i in obj) {
            let y = obj[i];
            if (typeof y === "object" && !Array.isArray(y) && !Array.isArray(y.arguments))
                x = [
                    ...x,
                    ...plainify(y, pre + i + ".")
                ];
            else
                x.push(pre + i);
        }
        return x;
    };
}
