import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import path from "path";
import {fileURLToPath} from 'url';
import {loadHookRunner} from "katnip";
import {parentPort, workerData} from "worker_threads";

//console.log("Worker launched: ",workerData);

const app=new Hono();
console.log("Loading hono middlewares...");

let hookRunner=await loadHookRunner(process.cwd(),{keyword: "katnip-cli"});

let launchEvent=workerData;
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
