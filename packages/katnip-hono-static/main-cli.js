import * as TOML from "@ltd/j-toml";
import path from "path";
import fs from "fs";

async function onWorkerModules(hookEvent) {
	console.log("adding hono static worker module for platform: "+hookEvent.platform);
	switch (hookEvent.platform) {
		case "node":
			hookEvent.workerModules.katnipHonoStatic="katnip-hono-static/main-server-node.js";
			break;

		case "wrangler":
			hookEvent.workerModules.katnipHonoStatic="katnip-hono-static/main-server-workerd.js";
			break;

		default:
			throw new Error("Unknown platform: "+hookEvent.platform);
			break;
	}
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

	hookRunner.on("worker-modules",onWorkerModules,{
		description: "Add hono static worker modules."
	});
}