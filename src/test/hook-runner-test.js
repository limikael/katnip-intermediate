import HookRunner from "../hooks/HookRunner.js";
import HookEvent from "../hooks/HookEvent.js";
import * as listenerModule from "./listener-mod.js";

async function listener1(ev) {
	console.log("listener1 invoked: "+ev.type);
	//ev.stopPropagation();

	/*await ev.runRemaining();
	await ev.runRemaining();*/
}

async function listener2(ev) {
	console.log("listener2 invoked: "+ev.type);
	//ev.stopPropagation();
}

async function listener3(ev) {
	console.log("listener3 invoked: "+ev.type);
}

let hookRunner=new HookRunner();

hookRunner.on("hello",listener1);
hookRunner.on("hello",listener2);
hookRunner.on("hello",listener3);
hookRunner.addListenerModule(listenerModule,{priority: 5});

hookRunner.sub("world","hello");

//await hookRunner.emit(new HookEvent("hello"));
await hookRunner.emit(new HookEvent("world"));
