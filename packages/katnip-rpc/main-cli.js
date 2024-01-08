import path from "path";

export async function onWorkerModules(hookEvent) {
	if (!hookEvent.packageJson.rpc) {
		console.log("rpc disabled, because not defined in package.json");
		return;
	}

	hookEvent.workerModules.katnipRpc="katnip-rpc/main-runtime.js";

	let rpcModulePath=path.join(process.cwd(),hookEvent.packageJson.rpc);

	console.log("Using rpc: "+rpcModulePath);
	hookEvent.workerModules.rpcModule=rpcModulePath;
}

export function onClientWrappers(hookEvent) {
	hookEvent.clientWrappers.push("katnip-rpc/client-wrapper.jsx");
}

export function registerHooks(hookRunner) {
	hookRunner.on("worker-modules",onWorkerModules);
	hookRunner.on("client-wrappers",onClientWrappers);
}