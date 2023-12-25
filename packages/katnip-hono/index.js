import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import path from "path";
import {fileURLToPath} from 'url';
import fs from "fs";
import {runCommand} from "./node-utils.js";
import {Job} from "katnip";
import {Worker} from "worker_threads";
import {ResolvablePromise} from "./js-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onDev(hookEvent) {
	await hookEvent.hookRunner.emit("build",{
		packageJson: hookEvent.packageJson,
		platform: hookEvent.platform,
		hookRunner: hookEvent.hookRunner
	});

	if (hookEvent.platform=="wrangler") {
        /*await runCommand("wrangler",["dev","--test-scheduled",
            "--config",".snapflow/worker/wrangler.toml",
        ],{passthrough: true});*/

        await runCommand("wrangler",["dev", 
        	"--config", ".target/wrangler.toml"
        ],{passthrough: true});
	}

	else {
		let startedPromise=new ResolvablePromise();
		let stoppedPromise=new ResolvablePromise();
		let worker=new Worker(path.join(__dirname,"dev-node-worker.js"));
		worker.on("message",(message)=>{
			switch (message) {
				case "started":
					startedPromise.resolve();
					break;

				case "stopped":
					worker.terminate();
					stoppedPromise.resolve();
					break;

				default:
					console.log("?? Got message from worker: "+message);
					break;
			}
		});

		await startedPromise;
		//console.log("Worker started...");

		return new Job(async ()=>{
			//console.log("Stopping worker...");
			worker.postMessage("stop");
			await stoppedPromise;
		});
	}
}

async function onBuild(hookEvent) {
	if (hookEvent.platform=="wrangler") {
		console.log("Building worker...");

		let workerModules={};
		await hookEvent.hookRunner.emit("worker-modules",{
			workerModules: workerModules
		});

		console.log("Using worker modules:");
		console.log(workerModules);

		let workerModulesSource=[];
		for (let k in workerModules)
			workerModulesSource+=`import * as ${k} from "${workerModules[k]}";\n`

		workerModulesSource+=`let workerModules={${Object.keys(workerModules).join(",")}};\n`;

		let workerStub=fs.readFileSync(path.join(__dirname,"worker-stub.js"),"utf8");
		let workerSource=workerStub.replace("$$WORKER_MODULES$$",workerModulesSource);

		fs.mkdirSync(path.join(process.cwd(),".target"),{recursive: true});
		fs.writeFileSync(path.join(process.cwd(),".target/worker.js"),workerSource);

		let wrangler=fs.readFileSync(path.join(__dirname,"wrangler.stub.toml"),"utf8");
		wrangler=wrangler.replace("$$PROJECT_NAME$$",hookEvent.packageJson.name);
		fs.writeFileSync(path.join(process.cwd(),".target/wrangler.toml"),wrangler);
	}
}

export function registerHooks(hookRunner) {
	hookRunner.internal.push("hono-middlewares","worker-modules");

	hookRunner.on("dev",onDev,{
		description: "Run build, and start hono dev server."
	});

	hookRunner.on("build",onBuild,{
		description: "Build worker, if applicable.",
		priority: 99
	});
}