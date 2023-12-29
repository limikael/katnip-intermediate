import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import path from "path";
import {fileURLToPath} from 'url';
import fs from "fs";
import {runCommand} from "./node-utils.js";
import {Job} from "katnip";
import {Worker} from "worker_threads";
import {ResolvablePromise} from "./js-util.js";
import * as TOML from "@ltd/j-toml";
import {DeclaredError} from "katnip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onDeploy(hookEvent) {
	switch (hookEvent.platform) {
		case "wrangler":
	        await runCommand(
	        	"wrangler",
	        	["deploy"], 
				{passthrough: true}
			);
			break;

		default:
			throw new DeclaredError("Can't deploy to platform: "+hookEvent.platform);
			break;
	}
}

async function onDev(hookEvent) {
	if (hookEvent.platform=="wrangler") {
        await runCommand(
        	"wrangler",
        	["dev"], 
			{passthrough: true}
		);
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

async function onEarlyDeploy(hookEvent) {
	if (!hookEvent.platform)
		hookEvent.platform="wrangler";

	let supportedPlatforms=["wrangler"];
	if (!supportedPlatforms.includes(hookEvent.platform))
		throw new DeclaredError("Unknown platform: "+hookEvent.platform+", supported: "+supportedPlatforms);

	console.log("Deploying to: "+hookEvent.platform);
}

async function onEarlyBuild(hookEvent) {
	if (!hookEvent.platform)
		hookEvent.platform="node";

	let supportedPlatforms=["node","wrangler"];
	if (!supportedPlatforms.includes(hookEvent.platform))
		throw new DeclaredError("Unknown platform: "+hookEvent.platform+", supported: "+supportedPlatforms);

	console.log("Building for: "+hookEvent.platform);

	if (hookEvent.platform=="wrangler") {
		let wrangler={};
		let wrangerPath=path.join(process.cwd(),"wrangler.toml");
		if (fs.existsSync(wrangerPath))
			wrangler=TOML.parse(fs.readFileSync(wrangerPath,"utf8"));

		if (wrangler.name && wrangler.name!=hookEvent.packageJson.name)
			throw new DeclaredError(
				"The name field in wrangler.toml is specified, and it is different from the package name. "+
				"Please set it to the same as the package name or remove it."
			);

		if (wrangler.main && wrangler.main!=".target/worker.js")
			throw new DeclaredError(
				"The main entry point in wrangler.toml is manually set to something different than "+
				".target/worker.js, please remove it and it will be set automatically."
			);

		wrangler.name=hookEvent.packageJson.name;
		wrangler.main=".target/worker.js";

		if (!wrangler.compatibility_date)
			wrangler.compatibility_date = "2023-10-30"

		fs.writeFileSync(wrangerPath,TOML.stringify(wrangler,{newline: "\n"}));
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
	}
}

export function registerHooks(hookRunner) {
	hookRunner.internal.push("hono-middlewares","worker-modules");

	hookRunner.on("deploy",onEarlyDeploy,{
		description: "Check deploy settings.",
		priority: 1,
	});

	hookRunner.sub("deploy","build");
	hookRunner.on("deploy",onDeploy,{
		description: "Deploy project.",
		priority: 20,
		options: {
			platform: "Platform to deploy to."
		}
	});

	hookRunner.sub("dev","build");
	hookRunner.on("dev",onDev,{
		description: "Start hono dev server.",
		priority: 20
	});

	hookRunner.on("build",onEarlyBuild,{
		description: "Check and update build settings.",
		priority: 1,
		options: {
			platform: "Platform to build for."
		}
	});

	hookRunner.on("build",onBuild,{
		description: "Build worker, if applicable.",
		priority: 99
	});
}