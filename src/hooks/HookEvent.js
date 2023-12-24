export default class HookEvent {
	constructor(type, options={}) {
		Object.assign(this,options);
		this.type=type;
	}

	stopPropagation() {
		this.propagationStopped=true;
	}

	clone() {
		return new HookEvent(this.type,this);
	}

	async runRemaining() {
		let newEvent=this.clone();
		newEvent.propagationStopped=false;

		return await this.hookRunner.runListeners(newEvent.remaining,newEvent);		
	}
}