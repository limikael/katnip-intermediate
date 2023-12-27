import {serveStatic} from '@hono/node-server/serve-static';
import * as TOML from "@ltd/j-toml";
import path from "path";
import fs from "fs";

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	console.log("Setting up hono static content...");

	app.use('*',serveStatic({root: './public'}))
}

async function onWorkerModules(hookEvent) {
	console.log("adding hono static worker module");
	hookEvent.workerModules.katnipHonoStatic="katnip-hono-static";
}

async function onBuild(hookEvent) {
	if (hookEvent.platform=="wrangler") {
		console.log("Checking wrangler content settings...");
		let wrangler={};
		let projectWranglerPath=path.join(process.cwd(),"wrangler.toml");
		if (fs.existsSync(projectWranglerPath))
			wrangler=TOML.parse(fs.readFileSync(projectWranglerPath,"utf8"));

		if (!wrangler.site) {
			console.log("Updating wrangler.toml with content bucket...");
			wrangler.site=TOML.Section({bucket: "public"});
			fs.writeFileSync(projectWranglerPath,TOML.stringify(wrangler,{newline: "\n"}));
		}
	}
}

export function registerHooks(hookRunner) {
	hookRunner.on("build",onBuild,{
		priority: 5,
		description: "Check content settings."
	});

	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 5,
		description: "Add hono middleware for static content."
	});

	hookRunner.on("worker-modules",onWorkerModules,{
		description: "Add hono static worker modules."
	});
}