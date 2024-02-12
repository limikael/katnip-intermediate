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

	//console.log("here",hookEvent);

	app.use("*",async c=>{
		return await isoqMiddleware(c.req.raw,{
		    localFetch: req=>{
		    	if (hookEvent.platform=="wrangler")
			    	return app.fetch(req,c.env,c.executionCtx)

			    else
			    	return app.fetch(req,c.env)
		    },
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