import {spawn} from "child_process";
import fs from "fs";
import path from "path";

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

export function resolveImport(cand) {
	if (!path.isAbsolute(cand)) {
		if (fs.existsSync(path.join(process.cwd(),cand)))
			cand=path.join(process.cwd(),cand);

		else if (fs.existsSync(path.join(process.cwd(),"node_modules",cand)))
			cand=path.join(process.cwd(),"node_modules",cand);

		else
			throw new Error("Unable to resolve relative: "+cand);
	}

	if (!fs.existsSync(cand))
		throw new Error("Unable to resolve absolute: "+cand);

	let stat=fs.statSync(cand);
	if (!stat.isDirectory())
		return cand;

	let pkg=JSON.parse(fs.readFileSync(path.join(cand,"package.json"),"utf8"));
	if (!pkg.main)
		throw new Error("No main in: "+path.join(cand,"package.json"));

	let modFileCand=path.join(cand,pkg.main);
	if (!fs.existsSync(modFileCand))
		throw new Error("Doesn't exist: "+modFileCand);

	return modFileCand;
}