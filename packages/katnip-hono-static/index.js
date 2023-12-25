import {serveStatic} from '@hono/node-server/serve-static';

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	console.log("Setting up hono static content...");

	app.use('*',serveStatic({root: './public'}))
}

async function onWorkerModules(hookEvent) {
	console.log("adding hono static worker module");
	hookEvent.workerModules.katnipHonoStatic="katnip-hono-static";
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 5,
		description: "Add hono middleware for static content."
	});

	hookRunner.on("worker-modules",onWorkerModules,{
		description: "Add hono static worker modules."
	});
}