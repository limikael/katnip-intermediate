export class DeclaredError extends Error {
	constructor(...args) {
		super(...args);
		this.declared=true;
	}
}

export class Job {
	constructor(stopper) {
		this.stopper=stopper;
	}

	async stop() {
		await this.stopper();
	}
}
