import {quickmin} from "quickmin/hono-middleware";
import {drizzleD1Driver} from "quickmin/drizzle-d1";
import {r2StorageDriver} from "quickmin/r2-storage";
import {parse as parseYaml} from "yaml";

async function onHonoMiddlewares(hookEvent) {
  let quickminYaml=hookEvent.workerData.quickminYaml;
  let quickminConf=parseYaml(quickminYaml);

  if (quickminConf.d1Binding && quickminConf.d1Binding!="DB")
  	throw new Error("D1 binding most be DB");

  if (quickminConf.r2Bucket && quickminConf.r2Bucket!="BUCKET")
  	throw new Error("R2 binding most be BUCKET");

  quickminConf.d1Binding="DB";
  quickminConf.r2Bucket="BUCKET";

	let app=hookEvent.app;

	let quickminDrivers=[
	    drizzleD1Driver,
	    r2StorageDriver,
	];

	app.use("*",quickmin(quickminConf,quickminDrivers));
}

export function registerHooks(hookRunner) {
	hookRunner.on("hono-middlewares",onHonoMiddlewares,{
		priority: 15,
		description: "Add hono middleware for quickmin."
	})
}