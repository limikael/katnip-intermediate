#!/usr/bin/env node

import path from "path";
import {fileURLToPath} from 'url';
import minimist from "minimist";
import {loadHookRunner} from "../hooks/hook-loader.js";
import HookEvent from "../hooks/HookEvent.js";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let argv=minimist(process.argv.slice(2));
let hookRunner=await loadHookRunner(process.cwd(),{keyword: "katnip-cli"});

if (argv._.length!=1) {
	console.log("Usage: katnip <hook>");
	console.log("Available hooks:");
	console.log();
    let listenersByEvent=hookRunner.getListenersByEvent();
    for (let event in listenersByEvent) {
        if (!hookRunner.internal.includes(event)) {
            console.log("  "+event+":");
            for (let listener of listenersByEvent[event])
                console.log("    - ["+listener.priority+"] "+listener.description);

            console.log();
        }
    }
    process.exit(1);
}

let packageJsonText=fs.readFileSync(path.join(process.cwd(),"package.json"),"utf8");
let packageJson=JSON.parse(packageJsonText);

try {
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