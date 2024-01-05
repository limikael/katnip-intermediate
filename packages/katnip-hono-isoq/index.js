import bundler from "isoq/bundler";
import path from "path";
import fs from "fs";
import {HookEvent} from "katnip";

async function onBuild(hookEvent) {
	if (!hookEvent.packageJson.main) {
		let e=new Error("No main in package.json");
		e.declared=true;
		throw e;
	}

	console.log("Bundling isoq middleware: "+hookEvent.packageJson.main);

	let clientWrapperEvent=hookEvent.clone();
	clientWrapperEvent.clientWrappers=[];
	clientWrapperEvent.type="client-wrappers"
	await hookEvent.hookRunner.emit(clientWrapperEvent);
	let clientWrappers=clientWrapperEvent.clientWrappers;

	console.log("Client wrappers: ",clientWrappers);

	let source="";
	for (let [index,wrapper] of clientWrappers.entries())
		source+=`import Wrapper${index} from "${wrapper}";\n`;

	let mainPath=path.join(process.cwd(),hookEvent.packageJson.main);
	source+=`import Main from "${mainPath}";\n\n`
	source+=`export default function(props) {\n`;
	source+=`  return (\n`;
	for (let i=0; i<clientWrappers.length; i++)
		source+=`    <Wrapper${i} {...props}>\n`;

	source+=`    <Main {...props}/>\n`;
	for (let i=clientWrappers.length-1; i>=0; i--)
		source+=`    </Wrapper${i}>\n`;

	source+=`  );\n`;
	source+=`}\n`;

	//console.log(source);
	fs.mkdirSync("node_modules/.katnip",{recursive: true});
	fs.writeFileSync("node_modules/.katnip/main.jsx",source);

	await bundler({
		entryPoint: path.join(process.cwd(),"node_modules/.katnip/main.jsx")
	});
}

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	//let modulePath=path.join(process.cwd(),"node_modules/__ISOQ_MIDDLEWARE/isoq-hono.js?random="+Math.random());
	let modulePath=path.join(process.cwd(),"node_modules/__ISOQ_MIDDLEWARE/isoq-hono.js");
	console.log("Loading isoq module: "+modulePath);

	let isoqMiddleware=(await import(modulePath)).default;

	async function getProps() {
		let event=new HookEvent("client-props",hookEvent.clone());
		event.props={};
		await hookEvent.hookRunner.emit(event);
		return event.props;
	}

	app.use("*",isoqMiddleware({
		localFetch: app.fetch,
		props: getProps
	}));
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
	hookRunner.internal.push("client-wrappers");
	hookRunner.internal.push("client-props");

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