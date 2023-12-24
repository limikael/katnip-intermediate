import bundler from "isoq/bundler";
import path from "path";

async function onBuild(hookEvent) {
	if (!hookEvent.packageJson.main) {
		let e=new Error("No main in package.json");
		e.declared=true;
		throw e;
	}

	console.log("Bundling isoq middleware: "+hookEvent.packageJson.main);
	await bundler({
		entryPoint: hookEvent.packageJson.main
	});
}

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	let modulePath=path.join(process.cwd(),"node_modules/__ISOQ_MIDDLEWARE/isoq-hono.js");
	console.log("Loading isoq module: "+modulePath);
	let isoqMiddleware=(await import(modulePath)).default;

	app.use("*",isoqMiddleware({localFetch: app.fetch}));
}

async function onWorkerModules(hookEvent) {
	hookEvent.workerModules.katnipHonoIsoq="katnip-hono-isoq";
	hookEvent.workerModules.isoqMiddleware="__ISOQ_MIDDLEWARE";
}

export function registerHooks(hookRunner) {
	hookRunner.on("build",onBuild,{
		description: "Build isoq middleware."
	});

	hookRunner.on("worker-modules",onWorkerModules)
	hookRunner.on("hono-middlewares",onHonoMiddlewares);
}