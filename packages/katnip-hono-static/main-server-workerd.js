import {serveStatic} from "fullstack-utils/hono-cloudflare-content";

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	console.log("Setting up hono static content for wrangler...");

	app.use("*",serveStatic());
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 5,
		description: "Add hono middleware for static content."
	})
}