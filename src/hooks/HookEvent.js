export default class HookEvent {
	constructor(type, options={}) {
		Object.assign(this,options);
		this.type=type;
	}

	stopPropagation() {
		this.propagationStopped=true;
	}

	clone() {
		let newEvent={...this};
		delete newEvent.propagationStopped;
		delete newEvent.hookRunner;
		//delete newEvent.remaining;

		return new HookEvent(this.type,newEvent);
	}

	async runRemaining() {
		let newEvent=this.clone();
		newEvent.propagationStopped=false;

		return await this.hookRunner.runListeners(newEvent.remaining,newEvent);		
	}
}