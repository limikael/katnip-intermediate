import HookEvent from "./HookEvent.js";

export default class HookRunner {
	constructor() {
		this.listeners=[];
		this.internal=[];
	}

	on(event, func, options={}) {
		if (!options.description)
			options.description="Unknown";

		options={...options, event, func};
		if (options.priority===undefined)
			options.priority=10;

		this.listeners.push(options);
	}

	getListenersByEvent() {
		let listenersByEvent={};
		for (let listener of this.listeners) {
			if (!listenersByEvent[listener.event])
				listenersByEvent[listener.event]=[];

			listenersByEvent[listener.event].push(listener);
			listenersByEvent[listener.event].sort((a,b)=>a.priority-b.priority);
		}

		return listenersByEvent;
	}

	getListenersForEvent(eventType) {
		let listenersByEvent=this.getListenersByEvent();
		let listeners=listenersByEvent[eventType];
		if (!listeners)
			listeners=[];

		return listeners;
	}

	async emit(event, eventOptions) {
		if (typeof event=="string")
			event=new HookEvent(event, eventOptions);

		else
			if (eventOptions)
				throw new Error("Event options only allowed if event is a string.");

		for (let listener of this.getListenersForEvent(event.type)) {
			await listener.func(event);
		}
	}
}