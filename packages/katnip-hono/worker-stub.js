import {Hono} from 'hono';
import {HookRunner, HookEvent} from "katnip";

$$WORKER_MODULES$$

let hookRunner=new HookRunner();
for (let k in workerModules)
	if (workerModules[k].registerHooks)
		workerModules[k].registerHooks(hookRunner);

const app=new Hono();

let launchEvent=$$LAUNCH_EVENT$$;
launchEvent.app=app;
launchEvent.workerModules=workerModules;

await hookRunner.emit(new HookEvent("hono-middlewares",launchEvent));

/*await hookRunner.emit("hono-middlewares",{
	workerModules: workerModules,
	app: app
});*/

export default app;
