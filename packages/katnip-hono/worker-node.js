import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import path from "path";
import {fileURLToPath} from 'url';
import {HookRunner} from "katnip";
import {parentPort, workerData} from "worker_threads";
import {resolveImport} from "./node-util.js";
//console.log("Worker launched: ",workerData);

let hookRunner=new HookRunner();
let launchEvent=workerData;

let workerModules=launchEvent.workerModules;
for (let k in workerModules) {
	workerModules[k]=await import(resolveImport(workerModules[k]));

	if (workerModules[k].registerHooks)
		workerModules[k].registerHooks(hookRunner);
}

let app=new Hono();
launchEvent.app=app;

await hookRunner.emit("hono-middlewares",launchEvent);

let resolveStarted;
let startedPromise=new Promise(r=>resolveStarted=r);

let server=serve(app,(info)=>{
    console.log(`** Listening on http://localhost:${info.port}`)
    resolveStarted();
});

await startedPromise;

parentPort.on("message",async (message)=>{
	switch (message) {
		case "stop":
			await server.close();
			console.log("Worker done...");
			parentPort.postMessage("stopped");
			break;
	}
});

parentPort.postMessage("started");
