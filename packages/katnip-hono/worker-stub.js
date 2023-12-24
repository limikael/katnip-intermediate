import {Hono} from 'hono';
import {HookRunner} from "katnip";

$$WORKER_MODULES$$

let hookRunner=new HookRunner();
for (let k in workerModules)
	if (workerModules[k].registerHooks)
		workerModules[k].registerHooks(hookRunner);

const app=new Hono();

await hookRunner.emit("hono-middlewares",{
	workerModules: workerModules,
	app: app
});

export default app;
