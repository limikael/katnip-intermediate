async function onHonoMiddlewares(hookEvent) {
	let isoqMiddleware=hookEvent.workerModules.isoqMiddleware;

	let app=hookEvent.app;

	app.use("*",isoqMiddleware.default({localFetch: app.fetch}));
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Serve isoq."
	})
}