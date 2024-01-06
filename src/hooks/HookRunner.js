import HookEvent from "./HookEvent.js";
import {arrayUnique} from "../utils/js-util.js";
import {listenerGetOptions, listenerGetOptionDescriptions} from "./listener-util.js";

export default class HookRunner {
	constructor() {
		this.listeners=[];
		this.internal=[];
	}

	on(event, func, options={}) {
		if (!options.description)
			options.description="Unknown";

		let listener={...options, event, func, hookRunner: this};
		if (listener.priority===undefined)
			listener.priority=10;

		this.listeners.push(listener);
	}

	sub(event, sub, options={}) {
		let listener={...options, event, sub, hookRunner: this};
		if (listener.priority===undefined)
			listener.priority=10;

		this.listeners.push(listener);
	}

	getEventTypes() {
		let eventTypes=[];
		for (let listener of this.listeners) {
			if (!eventTypes.includes(listener.event))
				eventTypes.push(listener.event);
		}

		return eventTypes;
	}

	getListenersByEventType(eventType) {
		let listeners=[];

		for (let listener of this.listeners) {
			if (listener.event==eventType)
				listeners.push(listener);
		}

		listeners.sort((a,b)=>a.priority-b.priority);

		return listeners;
	}

	getOptionsByEventType(eventType) {
		let listeners=this.getListenersByEventType(eventType);
		let options=[];

		for (let listener of listeners)
			options.push(...listenerGetOptions(listener));

		return arrayUnique(options);
	}

	getOptionDescriptions(eventType,option) {
		let listeners=this.getListenersByEventType(eventType);
		let optionDescriptions=[];

		for (let listener of listeners)
			optionDescriptions.push(...listenerGetOptionDescriptions(listener,option));

		return arrayUnique(optionDescriptions);
	}

	getClosuresByEventType(eventType) {
		let listeners=this.getListenersByEventType(eventType);
		let closures=[];

		for (let listener of listeners) {
			if (listener.func)
				closures.push(listener.func)

			else if (listener.sub)
				closures.push(async (ev)=>{
					await this.emit(listener.sub,ev.clone());
				});

			else
				throw new Error("What kind of listener is this?");
		}

		return closures;
	}

	/*async runListeners(listeners, event) {
		let ret;
		let remainingListeners=[...listeners];
		for (let listener of listeners) {
			remainingListeners.shift();
			event.remaining=remainingListeners;
			if (listener.func)
				ret=await listener.func(event);

			else if (listener.sub)
				await this.emit(listener.sub,event);

			else
				throw new Error("Not functional or sub?");

			if (event.propagationStopped)
				return;
		}

		return ret;
	}*/

	async emit(event, eventOptions) {
		if (typeof event=="string")
			event=new HookEvent(event, eventOptions);

		else
			if (eventOptions)
				throw new Error("Event options only allowed if event is a string.");

		console.log("running event ",event);

		event.run(this,this.getClosuresByEventType(event.type));
	}
}