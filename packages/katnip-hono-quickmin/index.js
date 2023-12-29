import {quickmin} from "quickmin/hono-middleware";
import {drizzleSqliteDriver} from "quickmin/drizzle-sqlite";
import fs from "fs";
import path from "path";
import * as TOML from "@ltd/j-toml";
import {findNodeBin, runCommand} from "./node-util.js";
import {fileURLToPath} from 'url';
import {DeclaredError} from "katnip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onHonoMiddlewares(hookEvent) {
	let app=hookEvent.app;

	console.log("Setting up hono quickmin...");

	let quickminYaml=fs.readFileSync("quickmin.yaml","utf8");
	let quickminDrivers=[
	    drizzleSqliteDriver,
	];

	app.use("*",quickmin(quickminYaml,quickminDrivers));
}

async function onWorkerModules(hookEvent) {
	console.log("adding hono quickmin worker module");
	hookEvent.workerModules.katnipHonoQuickmin="katnip-hono-quickmin";
	hookEvent.workerModules.quickminYaml="../quickmin.yaml";
}

async function onBuild(hookEvent) {
	if (hookEvent.platform=="wrangler") {
		console.log("Checking database settings in wrangler.toml");
		let wrangler={};
		let wranglerPath=path.join(process.cwd(),"wrangler.toml");
		if (fs.existsSync(wranglerPath))
			wrangler=TOML.parse(fs.readFileSync(wranglerPath,"utf8"));

		wrangler.node_compat = true;

		if (!wrangler.rules)
			wrangler.rules=[];

		let haveYamlRule=false;
		for (let rule of wrangler.rules)
			if (rule.globs.includes("**/*.yaml"))
				haveYamlRule=true;

		if (!haveYamlRule) {
			console.log("Adding yaml parsing rule to wrangler.toml");
			wrangler.rules.push({type: "Text", globs: ["**/*.yaml"], fallthrough: true})
		}

		if (!wrangler.d1_databases)
			wrangler.d1_databases=[];

		if (!wrangler.d1_databases.length) {
			console.log("Creating D1 database: "+wrangler.name);
			let wranglerBin=await findNodeBin(__dirname,"wrangler");

			let wranglerOut=await runCommand("wrangler",["d1","create",wrangler.name]);
			let matches=wranglerOut.match(/database_id\s*=\s*\"([^\"]*)\"/)
			if (!matches || !matches[1])
				throw new DeclaredError("Unable to parse wrangler output.");

			let databaseId=matches[1];
			console.log("Created D1 database id: "+databaseId);

			wrangler.d1_databases.push({
			    binding: 'DB',
			    database_name: wrangler.name,
			    database_id: databaseId
			});
		}

		if (!wrangler.r2_buckets)
			wrangler.r2_buckets=[];

		if (!wrangler.r2_buckets.length) {
			console.log("Creating R2 bucket: "+wrangler.name);
			let wranglerBin=await findNodeBin(__dirname,"wrangler");
			await runCommand(
				"wrangler",
				["r2","bucket","create",wrangler.name],
				{passthrough: true}
			);

			wrangler.r2_buckets.push({
			    binding: 'BUCKET',
			    bucket_name: wrangler.name,
			});
		}

		fs.writeFileSync(wranglerPath,TOML.stringify(wrangler,{newline: "\n"}));
	}
}

export async function onMigrate(hookEvent) {
	let quickminBin=await findNodeBin(__dirname,"quickmin");

	if (!hookEvent.platform)
		hookEvent.platform="node";

	let migrationTarget=hookEvent.type+":"+hookEvent.platform;
	console.log("Schema migration: "+migrationTarget);

	let quickminArgs=["migrate"];
	if (hookEvent.risky)
		quickminArgs.push("--risky");

	switch (migrationTarget) {
		case "dev:node":
			await runCommand(quickminBin,quickminArgs,{passthrough: true});
			break;

		case "dev:wrangler":
			await runCommand(quickminBin,[...quickminArgs,"--driver","wrangler-local"],{passthrough: true});
			break;

		case "deploy:wrangler":
			await runCommand(quickminBin,[...quickminArgs,"--driver","wrangler"],{passthrough: true});
			break;

		default:
			throw new Error("Unsupported migration target: "+migrationTarget);
			break;
	}

	/*switch (hookEvent.type) {
		case "dev":
			switch (hookEvent.platform) {
				case "node":
					break;

				default:
			}
			break;

		case "deploy":
			switch (hookEvent.platform) {
				case "wrangler":
					break;

				default:

					break;
			}
			break;

		default:
			throw new Error("Unknown event");
			break;
	}*/
}

const QUICKMIN_YAML=
`
jwtSecret: "changeme"
adminUser: "admin"
adminPass: "admin"
apiPath: "admin"

collections:
  pages:
    fields:
      <Text id="title" listable/>
      <RichText id="content"/>
`;

function onInit(hookEvent) {
	let quickminYamlFile="quickmin.yaml";
	if (!fs.existsSync(quickminYamlFile)) {
		console.log("Creating "+quickminYamlFile);
		fs.writeFileSync(quickminYamlFile,QUICKMIN_YAML);
	}
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 15,
		description: "Add hono middleware for quickmin."
	});

	hookRunner.on("worker-modules",onWorkerModules,{
		description: "Add quickmin worker modules."
	});

	hookRunner.on("build",onBuild,{
		description: "Check database settings."
	});

	hookRunner.on("dev",onMigrate,{
		description: "Migrate database schema.",
		priority: 15,
		options: {
			risky: "Perform risky schema migration."
		}
	});

	hookRunner.on("deploy",onMigrate,{
		description: "Migrate database schema.",
		priority: 15,
		options: {
			risky: "Perform risky schema migration."
		}
	});

	hookRunner.on("init",onInit,{
		description: "Create quickmin.yaml"
	});
}