import { load } from "yamljs";
import path, { join, resolve } from "path";
import { log, highlight, danger } from "termx";
import https from "https";
import fs from 'fs';

import * as ServerRender from './render/serve';
import { Socket } from "socket.io";

const Server = require('unete-io/server');
export var ServerState: {
    server?: any
} = {};

/*
 
   ___       _             __                     
  |_ _|_ __ | |_ ___ _ __ / _| __ _  ___ ___  ___ 
   | || '_ \| __/ _ \ '__| |_ / _` |/ __/ _ \/ __|
   | || | | | ||  __/ |  |  _| (_| | (_|  __/\__ \
  |___|_| |_|\__\___|_|  |_|  \__,_|\___\___||___/
                                                  
 
*/

    export interface Connection {
        socket: Socket;

        host: string;
        port: string;
        connected: boolean;
        connectedAt: Date;
    }

    export interface ServeConfig {
        main: string;

        name: string;
        host: string;
        port: number;

        logo?: string;
        log: string;
        log_persist: boolean;

        https?: {
            key: string;
            cert: string;
            ca: string;
        }
    }

    export interface ServerStats {
        methodStats: { [methodName: string]: {
            success: number;
            errors: number;
            total: number;
            pending: number;

            totalTime: number;
            
            lastError: string;
            lastErrorStack: string;
        }}

        connected: {
            [host: string] : { [port: string]: Connection }
        };

        connectedSockets: Map<Socket, Connection>;
    }

/*
 
    ____                                          _     
   / ___|___  _ __ ___  _ __ ___   __ _ _ __   __| |___ 
  | |   / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` / __|
  | |__| (_) | | | | | | | | | | | (_| | | | | (_| \__ \
   \____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|___/
                                                        
 
*/

export async function serve (cmd: any, configFile: string) {
    //? Init
        var config: ServeConfig = getConfig(configFile);
        var stats: ServerStats = {
            methodStats: {},
            connected: {},
            connectedSockets: new Map()
        };
        var methodTiming: { [iid: string]: number } = {};

        var module: any;

        log("Initializing server...");

    //? Import module
        module = require(config.main);

        if(module.default && Object.keys(module).length > 1) delete module.default;
    
    //? Config Https Server
        var https_server;
        
        if(config.https) {
            https_server = https.createServer({
                key : fs.readFileSync(path.resolve(process.cwd(), config.https.key)),
                cert: fs.readFileSync(path.resolve(process.cwd(), config.https.cert)),
                ca  : fs.readFileSync(path.resolve(process.cwd(), config.https.ca))
            });
        }

    //? Listen
        const getMethodStat = (method: string) => 
            stats.methodStats[method] ?? (
            stats.methodStats[method] = ({ 
                errors: 0,
                success: 0,
                total: 0,
                pending: 0,
                totalTime: 0,
                lastError: "",
                lastErrorStack: ""
            }))

        const server = ServerState.server = new Server({
            ...module,

            $before_call ({ path, iid }: any) {
                var methodName = path.join('.');
                var methodStats = getMethodStat(methodName)
                
                methodStats.pending++;
                methodStats.total++;

                methodTiming[iid] = Date.now()

                ServerRender.updateComponents("methods");

                module.$before_call && module.$before_call(arguments[0]);
            },

            $after_call ({ path, iid }: any) {
                var methodName = path.join('.');
                var methodStats = getMethodStat(methodName)

                
                methodStats.pending--;
                methodStats.success++;
                
                if(methodTiming[iid]) {
                    methodStats.totalTime += Date.now() - methodTiming[iid]
    
                    delete methodTiming[iid]
                }

                ServerRender.updateComponents("methods");
                module.$after_call && module.$after_call(arguments[0]);
            },

            $after_error ({ path, iid, error }: any) {
                var methodName = path.join('.');
                var methodStats = getMethodStat(methodName)

                methodStats.pending--;
                methodStats.errors++;

                methodStats.lastError = error.message || JSON.stringify(error);
                methodStats.lastErrorStack = error.stack ?? ""

                delete methodTiming[iid]
                ServerRender.updateComponents("methods", 'stack');

                module.$after_error && module.$after_error(arguments[0]);
            }

        }, https_server);

        if (config.https) {
            await https_server.listen(config.port);
        } else {
            await server.listen(config.port)
        }
        
    //? On Server Connection
        server.on('connection', (sock: any) => {
            ServerRender.logConnection(sock);
        });
    //? Render
        ServerRender.initRender({ config, server, module, stats });
}

/*
 
   _   _ _   _ _     
  | | | | |_(_) |___ 
  | | | | __| | / __|
  | |_| | |_| | \__ \
   \___/ \__|_|_|___/
                     
 
*/

export function getConfig(configFile: string = resolve(process.cwd(), "./unete.yml")): ServeConfig {
    var config: any = {};
    
    try { config = load(configFile); } catch (exc) {}
    
    const entryPoint: string = config.main || "index.js";

    return {
        main: join(process.cwd(), entryPoint),

        name: config.name || "Unete-IO",
        host: config.host ?? "127.0.0.1",
        port: config.port ?? 8080,

        logo: config.logo && resolve(process.cwd(), config.logo),
        https: config.https,

        log: resolve(process.cwd(), config.log ?? "./unete.log"),
        log_persist: !!config.log_persist
    }
}