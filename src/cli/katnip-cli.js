#!/usr/bin/env node

import path from "path";
import {fileURLToPath} from 'url';
import minimist from "minimist";
import {loadHookRunner} from "../hooks/hook-loader.js";
import HookEvent from "../hooks/HookEvent.js";
import {DeclaredError, jsonEq} from "../utils/js-util.js";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHookUsage(hookRunner, event) {
    let listeners=hookRunner.getListenersForEvent(event);

    console.log("  katnip "+event);
    for (let listener of listeners)
        console.log("    - ["+listener.priority+"] "+listener.description);

    console.log();
}

function printHookHelp(hookRunner, event) {
    console.log("Usage:");
    console.log();
    printHookUsage(hookRunner,event);

    let listeners=hookRunner.getListenersForEvent(event);
    let optionDescriptions={};
    for (let listener of listeners) {
        if (listener.optionDescriptions) {
            for (let k in listener.optionDescriptions) {
                if (!optionDescriptions[k])
                    optionDescriptions[k]=[];

                optionDescriptions[k].push(listener.optionDescriptions[k]);
            }
        }
    }

    console.log(optionDescriptions);
}

let booleanOptions=["help","version"];
let argv=minimist(process.argv.slice(2),{boolean: booleanOptions});
let hookRunner=await loadHookRunner(process.cwd(),{keyword: "katnip-cli"});

if (argv._.length==2 && argv._[0]=="help") {
    printHookHelp(hookRunner,argv._[1]);
    process.exit(1);
}

if (argv._.length==1 && argv.help) {
    printHookHelp(hookRunner,argv._[0])
    process.exit(1);
}

if (argv._.length!=1 || jsonEq(argv._,["help"])) {
    console.log("Usage:");
    console.log();
	console.log("  katnip help <hook>");
    console.log("    - Show detailed help about a hook.");
	console.log();
    let listenersByEvent=hookRunner.getListenersByEvent();
    for (let event in listenersByEvent) {
        if (argv.all || !hookRunner.internal.includes(event)) {
            printHookUsage(hookRunner,event);
        }
    }
    process.exit(1);
}

let packageJsonText=fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8");
let packageJson=JSON.parse(packageJsonText);

try {
    if (!hookRunner.getListenersForEvent(argv._[0]).length)
        throw new DeclaredError(`Command '${argv._[0]}' not understood.`);

    await hookRunner.emit(new HookEvent(argv._[0],{
        ...argv,
        hookRunner: hookRunner,
        packageJson: packageJson
    }));    
}

catch (e) {
    if (e.declared)
        console.log("[error] "+e.message);

    else
        throw e;
}