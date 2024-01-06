import {Hono} from 'hono';
import {HookRunner, HookEvent} from "katnip";
import {httpsRedirect} from "fullstack-utils/hono-https-redirect";

$$WORKER_MODULES$$

let hookRunner=new HookRunner();
for (let k in workerModules)
	if (workerModules[k].registerHooks)
		workerModules[k].registerHooks(hookRunner);

if (workerModules.serverEventHandler)
	hookRunner.addListenerModule(workerModules.serverEventHandler)

const app=new Hono();
app.use("*",httpsRedirect({
    ignore: ["localhost","127.0.0.1"]
}));

let launchEvent=$$LAUNCH_EVENT$$;
launchEvent.app=app;
launchEvent.workerModules=workerModules;
launchEvent.workerData=$$WORKER_DATA$$;

await hookRunner.emit(new HookEvent("hono-middlewares",launchEvent));

export default app;
