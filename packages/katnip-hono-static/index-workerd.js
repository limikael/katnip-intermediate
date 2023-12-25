import {serveStatic} from "fullstack-utils/hono-cloudflare-content";

async function onHonoMiddlewares(hookEvent) {
	let isoqMiddleware=hookEvent.workerModules.isoqMiddleware;

	let app=hookEvent.app;

	app.use("*",serveStatic());
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 5,
		description: "Add hono middleware for static content."
	})
}