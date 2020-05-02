import { ServeConfig, ServerStats, Connection, serve } from "..";
import { CreateBox, RenderBoxGroup, cold, highlight, danger, warning, RepeatText } from "termx";
import * as SocketIO from "socket.io";
import * as Logs from "./logs";
import { getMethods, MethodMetadata } from "../utils";
import Table from 'cli-table';
import { terminal as Terminal } from "terminal-kit";
import { unlinkSync } from "fs";

const { cyan, yellow } = require('chalk');
const nthline = require('nthline');

/*
 
   ____        __ _       _ _   _                 
  |  _ \  ___ / _(_)_ __ (_) |_(_) ___  _ __  ___ 
  | | | |/ _ \ |_| | '_ \| | __| |/ _ \| '_ \/ __|
  | |_| |  __/  _| | | | | | |_| | (_) | | | \__ \
  |____/ \___|_| |_|_| |_|_|\__|_|\___/|_| |_|___/
                                                  
 
*/
    declare type RENDER_COMPONENT_TYPE = "methods" | "connections" | "stack" | "logs" | "navbar" | "search";
    declare type SCREEN = "admin" | "logs";

    
    export var serverOptions: { config: ServeConfig, server: SocketIO.Server, module: any, stats: ServerStats } | null = null;
    export var serverMethods: MethodMetadata[];
    export var selectedMethod = 0;

    export var currentSearch = "";

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
export async function initRender (options: typeof serverOptions) {
    serverOptions = options;
    serverMethods = getMethods(serverOptions.module);

    await Logs.Init();
    
    updateComponents('methods', 'connections', 'stack', 'logs', 'navbar', 'search');
}

function render () {
    const { config, server } = serverOptions;
    
    { //? @note (Render) Render
        var str = RenderBoxGroup(
            renderComponents.methods + "\n" +
            renderComponents.search,
            renderComponents.stack + "\n" + 
            renderComponents.connections,
        );
    }
    
    { //? @note (Render) Display
        Logs.restore();

            console.clear();
            console.log(str);

        Logs.hook();
    }
}

export function updateComponents (...components: RENDER_COMPONENT_TYPE[]) {

    for(const component of components) {
        switch (component) {
            case 'methods': methods(); break;
            case 'connections': connections(); break;
            case 'stack': stack(); break;
            case 'logs': logs(); break;
            case 'navbar': navbar(); break;
            case 'search': search(); break;
        }
    }

    render();
}

function navbar () {
    
}

function search () {
    renderComponents.search = cold("Search: ") + currentSearch;
}

function methods () {
    const table = new Table({
        head: [
            cold     ('Method'),
            highlight("Success"),
            danger   ("Errors"),
            cold     ("In Progress"),
            cold     ("Average Time (ms)"),
            danger   ("Last Error")
        ]
    });
    { //? @note (Methods) Filter
        var selection = serverMethods.filter(x => x.name.toLowerCase().includes(currentSearch)); 
        var methodsToShow = Math.floor(process.stdout.rows / 3);
        selectedMethod = selectedMethod < 0? selectedMethod : selectedMethod >= selection.length? selection.length - 1 : selectedMethod;


        var firstMethod = selectedMethod > methodsToShow? selectedMethod - methodsToShow : 0;
        if(firstMethod + methodsToShow >= selection.length)
            firstMethod = selection.length - methodsToShow - 1;
        if(firstMethod < 0)
            firstMethod = 0;
    }
    
    { //? @note (Methods) Render
        selection
            .slice(firstMethod, firstMethod + methodsToShow + 1)
            .forEach((x, i) => {
                const stats = serverOptions.stats.methodStats[x.name];
                const isSelected = (i + firstMethod) === selectedMethod; //? @note (Methods.Render) DrawPointer

                table.push([ //? @note (Methods.Render) render
                    (`${
                        (isSelected? cold("→ ") : "  ") +
                        x.name
                    }(${
                        x.args.map(cold).join(", ")
                    })`), // Method,

                    highlight(stats?.success.toString() ?? "0"),
                    danger(stats?.errors.toString() ?? "0"),
                        stats?.pending.toString() ?? "0",
                    
                    (stats?.totalTime / stats?.success) || 0,
                    
                    danger(stats?.lastError ?? "-")
                ])
            })
        
        while(table.length < methodsToShow) {
            table.push([" ", " ", " ", " ", " ", " "])
        }
    }
    
    renderComponents.methods = CreateBox("Methods", table.toString());
}

//? @note (Connections) Main
function connections () {
    const renderMethodsWidth = renderComponents.methods.substring(0, renderComponents.methods.indexOf("\n")).length;
    const availableSpace = process.stdout.columns - renderMethodsWidth - 8;
    
    const connectedIPs = Object.keys(serverOptions.stats.connected);

    const connections = CreateBox(
        `Connections (${connectedIPs.length})`,
        ...connectedIPs.map(ip =>
            `(${Object.keys(serverOptions.stats.connected[ip]).length}) ${cold(ip)}`
        ),
        RepeatText(" ", availableSpace)
    )

    renderComponents.connections = connections
}

//? @note (Stack) Main
function stack () {
    const renderMethodsWidth = renderComponents.methods.substring(0, renderComponents.methods.indexOf("\n")).length;
    const availableSpace = process.stdout.columns - renderMethodsWidth - 8;

    {//? @note (Stack) Fetch Info
        var method = serverMethods[selectedMethod];
        var stats = method && serverOptions.stats.methodStats[method.name];

        if(!method) return RepeatText(" ", availableSpace);
    }

    {//? @note (Stack) Render
        renderComponents.stack = CreateBox(
            "Error Stack",
            (
                stats?.lastErrorStack?.
                    replace(/^Error: (.+)/, ($0: string, $1: string) => `Error: ${danger($1)}`).
                    replace(/ \((.+):(.+):(.+)\)/g, ($0: string, file: string, line: string, column: string) => {
                        return ` (${cyan(file)}:${yellow(line)}:${yellow(column)})`;
                    })
                ??
                    ""
            ) + "\n" + RepeatText(" ", availableSpace)
        )
    }
}

function logs () {
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

    export function logConnection (socket: SocketIO.Socket) {
        {//? @note (Log Connection) Definitions
            var host = socket.request.connection.remoteAddress;
            var port = socket.request.connection.remotePort;
            var _ = serverOptions.stats;

            var IPConnections = _.connected[host] || (_.connected[host] = {});

            var connection: Connection = IPConnections[port] || {
                socket,
                host,
                port,
                connected: true,
                connectedAt: new Date()
            }
        }

        {//? @note (Log Connection) On User Disconnect
            socket.once('disconnect', () => {
                _.connectedSockets.delete(socket);

                if(!_.connected[host]) return;

                delete _.connected[host][port];
                
                if(Object.keys(_.connected[host]).length === 0) delete _.connected[host];
                
                updateComponents("connections")
            })
        }

        {//? @note (Log Connection) Register & Update
            _.connected[host][port] = connection
            _.connectedSockets.set(socket, connection)
            
            process.nextTick(() => updateComponents("connections"))
        }
    }

    function terminate() {
        Terminal.grabInput(false);
        if(!serverOptions.config.log_persist)
            unlinkSync(serverOptions.config.log);

        setTimeout( function() { process.exit() } , 100 ) ;
    }


    function configTerminal () {
        Terminal.grabInput({});

        Terminal.on('key', function(key: string) { //? @note (KeyEvent) Receive
            
            
            if(/^[a-zA-Z]$/.exec(key)) { //? @note (KeyEvent.Receive) Add Key to Search
                currentSearch += key.toLowerCase();
                selectedMethod = 0;

                updateComponents("methods", "search", "stack", "connections")
                return;
            }

            switch(key) {
                case 'CTRL_C': terminate(); break; //? @note (KeyEvent.Receive) Kill Program
                case 'DOWN': selectedMethod++; break; //? @note (KeyEvent.Receive) Move Method Pointer Down
                case 'UP': selectedMethod--; break; //? @note (KeyEvent.Receive) Move Method Pointer Up
                
                case 'BACKSPACE': //? @note (KeyEvent.Receive) Pop Search Last Character
                    currentSearch = currentSearch.substring(0, currentSearch.length - 1);
                    selectedMethod = 0;
                break;

                default:
                    console.log({ key })
            }

            {//? @note (KeyEvent) Render
                if(selectedMethod >= serverMethods.length) selectedMethod = serverMethods.length - 1;
                if(selectedMethod < 0) selectedMethod = 0;

                updateComponents("methods", "stack", "navbar", "search", "connections");
            }
        });
    }