import bundler from "isoq/bundler";
import path from "path";
import fs from "fs";

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

	//let modulePath=path.join(process.cwd(),"node_modules/__ISOQ_MIDDLEWARE/isoq-hono.js?random="+Math.random());
	let modulePath=path.join(process.cwd(),"node_modules/__ISOQ_MIDDLEWARE/isoq-hono.js");
	console.log("Loading isoq module: "+modulePath);

	let isoqMiddleware=(await import(modulePath)).default;

	app.use("*",isoqMiddleware({localFetch: app.fetch}));
}

async function onWorkerModules(hookEvent) {
	hookEvent.workerModules.katnipHonoIsoq="katnip-hono-isoq";
	hookEvent.workerModules.isoqMiddleware="__ISOQ_MIDDLEWARE";
}

const INDEX_JSX=
`export default function() {
    return (<>
        <div>Hello World</div>
        <div>The project begins here...</div>
    </>);
}
`;

async function onInit(hookEvent) {
	if (!hookEvent.packageJson.main) {
		console.log("Setting main in package.json");
		hookEvent.packageJson.main="src/main/index.jsx";
		fs.writeFileSync("package.json",JSON.stringify(hookEvent.packageJson,null,2));
	}

	if (!fs.existsSync(hookEvent.packageJson.main)) {
		console.log("Creating "+hookEvent.packageJson.main);
		fs.mkdirSync(path.dirname(hookEvent.packageJson.main),{recursive: true});
		fs.writeFileSync(hookEvent.packageJson.main,INDEX_JSX);
	}
}

export function registerHooks(hookRunner) {
	hookRunner.on("build",onBuild,{
		description: "Build isoq middleware."
	});

	hookRunner.on("worker-modules",onWorkerModules,{
		description: "Add isoq worker modules."
	});

	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		description: "Add isoq hono middleware.",
		priority: 20
	});

	hookRunner.on("init",onInit,{
		description: "Create entry-point .jsx file."
	});
}