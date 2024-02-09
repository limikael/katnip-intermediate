import {HookEvent} from "katnip";

async function onHonoMiddlewares(hookEvent) {
	let isoqMiddleware=hookEvent.workerModules.isoqMiddleware.default;
	let app=hookEvent.app;

	async function getProps() {
		let event=new HookEvent("client-props",hookEvent.clone());
		event.props={};
		await hookEvent.hookRunner.emit(event);
		return event.props;
	}

	app.use("*",async c=>{
		return await isoqMiddleware(c.req.raw,{
		    localFetch: req=>app.fetch(req,c.env,c.executionCtx),
//		    localFetch: app.fetch,
			props: getProps
		});
	});
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Add isoq hono middleware.",
		priority: 20
	})
}