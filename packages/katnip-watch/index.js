import path from "path";
import {fileURLToPath} from 'url';
import fs from "fs";
import chokidar from "chokidar";
import {ResolvablePromise} from "./js-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onDev(hookEvent) {
	hookEvent.stopPropagation();

	let watchDirs=[process.cwd()];
	let ignored=[
		"**/node_modules/**", "**/.git/**", "**/*.db*",
		"**/.env", "**/package.json", "**/package-lock.json", "**/yarn.lock",
		"**/katnip-cli.js","**/public","**/.target","**/.wrangler",
		"**/wrangler.toml"
	];

	let watcher=chokidar.watch(watchDirs,{
		ignored: ignored,
	});

	let startPromise=new ResolvablePromise();
	let	changePromise=new ResolvablePromise();

	watcher.on("ready",(ev, p)=>{
		watcher.on("all",(ev, p)=>{
			console.log("File change: "+ev+" "+p);
			changePromise.resolve();
		});

		startPromise.resolve();
	});

	await startPromise;

	console.log("Watching for changes...");

	while (true) {
		let job=await hookEvent.runRemaining();
		await changePromise;
		console.log();
		console.log("Change detected...");
		changePromise=new ResolvablePromise();

		if (job && job.stop) {
			console.log("Stopping current job...");
			await job.stop();
		}

		else {
			console.log("Job can't be stopped.");
		}

		/*console.log("waiting...");
		await new Promise(r=>setTimeout(r,1000));*/
	}
}

export function registerHooks(hookRunner) {
	hookRunner.internal.push("hono-middlewares","worker-modules");

	hookRunner.on("dev",onDev,{
		description: "Watch for changed files, re-run rest of commands.",
		priority: 5
	});
}