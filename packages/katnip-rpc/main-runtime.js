import {quickRpc} from "fullstack-utils/hono-quick-rpc";

async function onHonoMiddlewares(hookEvent) {
	console.log("Installing rpc middleware...");

	let rpcModule=hookEvent.workerModules.rpcModule.default;

	hookEvent.app.use("/rpc",quickRpc(rpcModule));
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Hono middleware for rpc.",
		priority: 15
	});
}