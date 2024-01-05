import {HookEvent} from "katnip";

async function onHonoMiddlewares(hookEvent) {
	let isoqMiddleware=hookEvent.workerModules.isoqMiddleware;
	let app=hookEvent.app;

	async function getProps() {
		let event=new HookEvent("client-props",hookEvent.clone());
		event.props={};
		await hookEvent.hookRunner.emit(event);
		return event.props;
	}

	app.use("*",isoqMiddleware.default({
		localFetch: app.fetch,
		props: getProps
	}));
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Add isoq hono middleware.",
		priority: 20
	})
}