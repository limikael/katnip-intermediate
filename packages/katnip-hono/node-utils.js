import {spawn} from "child_process";

export async function runCommand(command, args=[], options={}) {
	const child=spawn(command, args, options);
	let out="";

	await new Promise((resolve,reject)=>{
		child.stdout.on('data', (data) => {
			if (options.passthrough)
				process.stdout.write(data);

			out+=data;
		});

		child.stderr.on('data', (data) => {
			if (options.passthrough)
				process.stderr.write(data);

			else
				console.log(`stderr: ${data}`);
		});

		child.on('close', (code) => {
			if (code) {
				console.log(out);
				return reject(new Error(command+" exit code: "+code))
			}

			resolve();
		});
	});

	return out;
}
