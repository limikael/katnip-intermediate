import {runCommand, findNodeBin} from "./node-util.js";
import path from "path";
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onBuild(hookEvent) {
	console.log("Building tailwind...");
	let tailwind=await findNodeBin(__dirname,"tailwind");

	await runCommand(tailwind,[
		"--minify",
		"-i","./src/main/index.css",
		"-o","./public/index.css"
	],{passthrough: true});
}

export function registerHooks(hookRunner) {
	hookRunner.on("build",onBuild,{
		description: "Build tailwind.",
		priority: 50
	});
}