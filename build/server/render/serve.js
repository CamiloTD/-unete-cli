var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const termx_1 = require("termx");
const Logs = __importStar(require("./logs"));
const utils_1 = require("../utils");
const cli_table_1 = __importDefault(require("cli-table"));
const terminal_kit_1 = require("terminal-kit");
const fs_1 = require("fs");
const { cyan, yellow } = require('chalk');
const nthline = require('nthline');
exports.serverOptions = null;
exports.selectedMethod = 0;
exports.currentSearch = "";
configTerminal();
var renderComponents = {
    addrinfo: "",
    methods: "",
    connections: "",
    stack: "",
    logs: "",
    navbar: "",
    search: ""
};
/*
 
   ____                _
  |  _ \ ___ _ __   __| | ___ _ __
  | |_) / _ \ '_ \ / _` |/ _ \ '__|
  |  _ <  __/ | | | (_| |  __/ |
  |_| \_\___|_| |_|\__,_|\___|_|
                                   
 
*/
function initRender(options) {
    return __awaiter(this, void 0, void 0, function* () {
        exports.serverOptions = options;
        exports.serverMethods = utils_1.getMethods(exports.serverOptions.module);
        yield Logs.Init();
        updateComponents('methods', 'connections', 'stack', 'logs', 'navbar', 'search');
    });
}
exports.initRender = initRender;
function render() {
    const { config, server } = exports.serverOptions;
    { //? @note (Render) Render
        var str = termx_1.RenderBoxGroup(renderComponents.methods + "\n" +
            renderComponents.search, renderComponents.stack + "\n" +
            renderComponents.connections);
    }
    { //? @note (Render) Display
        Logs.restore();
        console.clear();
        console.log(str);
        Logs.hook();
    }
}
function updateComponents(...components) {
    for (const component of components) {
        switch (component) {
            case 'methods':
                methods();
                break;
            case 'connections':
                connections();
                break;
            case 'stack':
                stack();
                break;
            case 'logs':
                logs();
                break;
            case 'navbar':
                navbar();
                break;
            case 'search':
                search();
                break;
        }
    }
    render();
}
exports.updateComponents = updateComponents;
function navbar() {
}
function search() {
    renderComponents.search = termx_1.cold("Search: ") + exports.currentSearch;
}
function methods() {
    const table = new cli_table_1.default({
        head: [
            termx_1.cold('Method'),
            termx_1.highlight("Success"),
            termx_1.danger("Errors"),
            termx_1.cold("In Progress"),
            termx_1.cold("Average Time (ms)"),
            termx_1.danger("Last Error")
        ]
    });
    { //? @note (Methods) Filter
        var selection = exports.serverMethods.filter(x => x.name.toLowerCase().includes(exports.currentSearch));
        var methodsToShow = Math.floor(process.stdout.rows / 3);
        exports.selectedMethod = exports.selectedMethod < 0 ? exports.selectedMethod : exports.selectedMethod >= selection.length ? selection.length - 1 : exports.selectedMethod;
        var firstMethod = exports.selectedMethod > methodsToShow ? exports.selectedMethod - methodsToShow : 0;
        if (firstMethod + methodsToShow >= selection.length)
            firstMethod = selection.length - methodsToShow - 1;
        if (firstMethod < 0)
            firstMethod = 0;
    }
    { //? @note (Methods) Render
        selection
            .slice(firstMethod, firstMethod + methodsToShow + 1)
            .forEach((x, i) => {
            var _a, _b, _c, _d;
            const stats = exports.serverOptions.stats.methodStats[x.name];
            const isSelected = (i + firstMethod) === exports.selectedMethod; //? @note (Methods.Render) DrawPointer
            table.push([
                (`${(isSelected ? termx_1.cold("→ ") : "  ") +
                    x.name}(${x.args.map(termx_1.cold).join(", ")})`),
                termx_1.highlight((_a = stats === null || stats === void 0 ? void 0 : stats.success.toString()) !== null && _a !== void 0 ? _a : "0"),
                termx_1.danger((_b = stats === null || stats === void 0 ? void 0 : stats.errors.toString()) !== null && _b !== void 0 ? _b : "0"),
                (_c = stats === null || stats === void 0 ? void 0 : stats.pending.toString()) !== null && _c !== void 0 ? _c : "0",
                ((stats === null || stats === void 0 ? void 0 : stats.totalTime) / (stats === null || stats === void 0 ? void 0 : stats.success)) || 0,
                termx_1.danger((_d = stats === null || stats === void 0 ? void 0 : stats.lastError) !== null && _d !== void 0 ? _d : "-")
            ]);
        });
        while (table.length < methodsToShow) {
            table.push([" ", " ", " ", " ", " ", " "]);
        }
    }
    renderComponents.methods = termx_1.CreateBox("Methods", table.toString());
}
//? @note (Connections) Main
function connections() {
    const renderMethodsWidth = renderComponents.methods.substring(0, renderComponents.methods.indexOf("\n")).length;
    const availableSpace = process.stdout.columns - renderMethodsWidth - 8;
    const connectedIPs = Object.keys(exports.serverOptions.stats.connected);
    const connections = termx_1.CreateBox(`Connections (${connectedIPs.length})`, ...connectedIPs.map(ip => `(${Object.keys(exports.serverOptions.stats.connected[ip]).length}) ${termx_1.cold(ip)}`), termx_1.RepeatText(" ", availableSpace));
    renderComponents.connections = connections;
}
//? @note (Stack) Main
function stack() {
    var _a, _b;
    const renderMethodsWidth = renderComponents.methods.substring(0, renderComponents.methods.indexOf("\n")).length;
    const availableSpace = process.stdout.columns - renderMethodsWidth - 8;
    { //? @note (Stack) Fetch Info
        var method = exports.serverMethods[exports.selectedMethod];
        var stats = method && exports.serverOptions.stats.methodStats[method.name];
        if (!method)
            return termx_1.RepeatText(" ", availableSpace);
    }
    { //? @note (Stack) Render
        renderComponents.stack = termx_1.CreateBox("Error Stack", ((_b = (_a = stats === null || stats === void 0 ? void 0 : stats.lastErrorStack) === null || _a === void 0 ? void 0 : _a.replace(/^Error: (.+)/, ($0, $1) => `Error: ${termx_1.danger($1)}`).replace(/ \((.+):(.+):(.+)\)/g, ($0, file, line, column) => {
            return ` (${cyan(file)}:${yellow(line)}:${yellow(column)})`;
        })) !== null && _b !== void 0 ? _b : "") + "\n" + termx_1.RepeatText(" ", availableSpace));
    }
}
function logs() {
    renderComponents.logs = Logs.logs;
}
/*
 
   ____  _        _              _   _           _       _
  / ___|| |_ __ _| |_ ___  ___  | | | |_ __   __| | __ _| |_ ___  ___
  \___ \| __/ _` | __/ _ \/ __| | | | | '_ \ / _` |/ _` | __/ _ \/ __|
   ___) | || (_| | ||  __/\__ \ | |_| | |_) | (_| | (_| | ||  __/\__ \
  |____/ \__\__,_|\__\___||___/  \___/| .__/ \__,_|\__,_|\__\___||___/
                                      |_|
 
*/
function logConnection(socket) {
    { //? @note (Log Connection) Definitions
        var host = socket.request.connection.remoteAddress;
        var port = socket.request.connection.remotePort;
        var _ = exports.serverOptions.stats;
        var IPConnections = _.connected[host] || (_.connected[host] = {});
        var connection = IPConnections[port] || {
            socket,
            host,
            port,
            connected: true,
            connectedAt: new Date()
        };
    }
    { //? @note (Log Connection) On User Disconnect
        socket.once('disconnect', () => {
            _.connectedSockets.delete(socket);
            if (!_.connected[host])
                return;
            delete _.connected[host][port];
            if (Object.keys(_.connected[host]).length === 0)
                delete _.connected[host];
            updateComponents("connections");
        });
    }
    { //? @note (Log Connection) Register & Update
        _.connected[host][port] = connection;
        _.connectedSockets.set(socket, connection);
        process.nextTick(() => updateComponents("connections"));
    }
}
exports.logConnection = logConnection;
function terminate() {
    terminal_kit_1.terminal.grabInput(false);
    if (!exports.serverOptions.config.log_persist)
        fs_1.unlinkSync(exports.serverOptions.config.log);
    setTimeout(function () { process.exit(); }, 100);
}
function configTerminal() {
    terminal_kit_1.terminal.grabInput({});
    terminal_kit_1.terminal.on('key', function (key) {
        if (/^[a-zA-Z]$/.exec(key)) { //? @note (KeyEvent.Receive) Add Key to Search
            exports.currentSearch += key.toLowerCase();
            exports.selectedMethod = 0;
            updateComponents("methods", "search", "stack", "connections");
            return;
        }
        switch (key) {
            case 'CTRL_C':
                terminate();
                break; //? @note (KeyEvent.Receive) Kill Program
            case 'DOWN':
                exports.selectedMethod++;
                break; //? @note (KeyEvent.Receive) Move Method Pointer Down
            case 'UP':
                exports.selectedMethod--;
                break; //? @note (KeyEvent.Receive) Move Method Pointer Up
            case 'BACKSPACE': //? @note (KeyEvent.Receive) Pop Search Last Character
                exports.currentSearch = exports.currentSearch.substring(0, exports.currentSearch.length - 1);
                exports.selectedMethod = 0;
                break;
            default:
                console.log({ key });
        }
        { //? @note (KeyEvent) Render
            if (exports.selectedMethod >= exports.serverMethods.length)
                exports.selectedMethod = exports.serverMethods.length - 1;
            if (exports.selectedMethod < 0)
                exports.selectedMethod = 0;
            updateComponents("methods", "stack", "navbar", "search", "connections");
        }
    });
}
