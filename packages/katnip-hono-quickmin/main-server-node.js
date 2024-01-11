import {quickmin} from "quickmin/hono-middleware";
import {drizzleSqliteDriver} from "quickmin/drizzle-sqlite";
import {nodeStorageDriver} from "quickmin/node-storage";
import {localNodeBundle} from "quickmin/local-node-bundle";

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	console.log("Setting up hono quickmin...");

	let quickminYaml=hookEvent.workerData.quickminYaml;
	let quickminDrivers=[
	    drizzleSqliteDriver,
	    nodeStorageDriver,
        //localNodeBundle
	];

	app.use("*",quickmin(quickminYaml,quickminDrivers));
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 15,
		description: "Add hono middleware for quickmin."
	})
}