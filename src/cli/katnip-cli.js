#!/usr/bin/env node

import path from "path";
import {fileURLToPath} from 'url';
import minimist from "minimist";
import {loadHookRunner} from "../hooks/hook-loader.js";
import HookEvent from "../hooks/HookEvent.js";
import {DeclaredError, jsonEq} from "../utils/js-util.js";
import fs from "fs";
import {listenerGetDescription} from "../hooks/listener-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function printHookUsage(hookRunner, event) {
    let listeners=hookRunner.getListenersByEventType(event);

    console.log("  katnip "+event);
    for (let listener of listeners)
        console.log("    - ["+listener.priority+"] "+listenerGetDescription(listener));

    console.log();
}

function printHookHelp(hookRunner, event) {
    console.log("Usage:");
    console.log();
    printHookUsage(hookRunner,event);

    let options=hookRunner.getOptionsByEventType(event);
    if (options.length) {
        console.log("Options:");
        console.log();

        for (let option of options) {
            console.log("  katnip "+event+" --"+option+"=<value>");
            for (let desc of hookRunner.getOptionDescriptions(event,option))
                console.log("    - "+desc);

            console.log();
        }

    }
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
    for (let eventType of hookRunner.getEventTypes()) {
        if (argv.all || !hookRunner.internal.includes(eventType)) {
            printHookUsage(hookRunner,eventType);
        }
    }
    process.exit(1);
}

let packageJsonText=fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8");
let packageJson=JSON.parse(packageJsonText);

try {
    if (!hookRunner.getListenersByEventType(argv._[0]).length)
        throw new DeclaredError(`Command '${argv._[0]}' not understood.`);

    let hookOptions={...argv};
    delete hookOptions._;
    delete hookOptions.help;
    delete hookOptions.version;

    let acceptedOptions=hookRunner.getOptionsByEventType(argv._[0]);
    for (let option in hookOptions)
        if (!acceptedOptions.includes(option))
            throw new DeclaredError(`Option '${option}' not understood.`);

    await hookRunner.emit(new HookEvent(argv._[0],{
        ...hookOptions,
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