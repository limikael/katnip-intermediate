import {runCommand, findNodeBin} from "./node-util.js";
import path from "path";
import {fileURLToPath} from 'url';
import {DeclaredError} from "katnip";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function onBuild(hookEvent) {
	console.log("Building tailwind...");
	let tailwind=await findNodeBin(__dirname,"tailwind");

	let mainParts=path.parse(hookEvent.packageJson.main);
	let input=path.join(mainParts.dir,mainParts.name+".css");
	let output=path.join("public",mainParts.name+".css");

	await runCommand(tailwind,[
		"--minify",
		"-i",input,
		"-o",output
	],{passthrough: true});
}

const INDEX_CSS=
`@tailwind base;
@tailwind components;
@tailwind utilities;
`;

const TAILWIND_CONFIG_JS=
`module.exports = {
  content: ["./src/**/*.jsx"],
  theme: {
    extend: {
    }
  }
}
`;

async function onInit(hookEvent) {
	if (!hookEvent.packageJson.main)
		throw new DeclaredError("Main no set in package.json");

	let mainParts=path.parse(hookEvent.packageJson.main);
	let input=path.join(mainParts.dir,mainParts.name+".css");

	if (!fs.existsSync(input)) {
		console.log("Creating "+input);
		fs.writeFileSync(input,INDEX_CSS);
	}

	let tailwindConfigFile="tailwind.config.js";
	if (!fs.existsSync(tailwindConfigFile)) {
		console.log("Creating "+tailwindConfigFile);
		fs.writeFileSync(tailwindConfigFile,TAILWIND_CONFIG_JS);
	}
}

export function registerHooks(hookRunner) {
	hookRunner.on("build",onBuild,{
		description: "Build tailwind.",
		priority: 50
	});

	hookRunner.on("init",onInit,{
		description: "Create default tailwind .css file.",
		priority: 50
	});
}