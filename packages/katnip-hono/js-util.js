export class ResolvablePromise extends Promise {
	constructor(cb = () => {}) {
        let resolveClosure = null;
        let rejectClosure = null;

		super((resolve,reject)=>{
            resolveClosure = resolve;
            rejectClosure = reject;

			return cb(resolve, reject);
		});

        this.resolveClosure = resolveClosure;
        this.rejectClosure = rejectClosure;
 	}

	resolve() {
		this.resolveClosure();
	}
}