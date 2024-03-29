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

export function jsonEq(a,b) {
	return (JSON.stringify(a)==JSON.stringify(b));
}

export function arrayUnique(a) {
	function onlyUnique(value, index, array) {
		return array.indexOf(value) === index;
	}

	return a.filter(onlyUnique);
}
