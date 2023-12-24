import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import path from "path";
import {fileURLToPath} from 'url';
import fs from "fs";
import {runCommand} from "./node-utils.js";

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
            ".target/worker.js",
        ],{passthrough: true});
	}

	else {
		const app=new Hono();
		console.log("** Loading hono middlewares **");

		await hookEvent.hookRunner.emit("hono-middlewares",{
			app: app
		});

		serve(app,(info)=>{
		    console.log(`Listening on http://localhost:${info.port}`)
		});
	}
}

async function onBuild(hookEvent) {
	if (hookEvent.platform=="wrangler") {
		console.log("Building worker...");

		let workerModules={};
		hookEvent.hookRunner.emit("worker-modules",{
			workerModules: workerModules
		});

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

	hookRunner.on("dev",onDev,{
		description: "Run build, and start hono dev server."
	});

	hookRunner.on("build",onBuild,{
		description: "Build worker, if applicable.",
		priority: 99
	});
}