#!/usr/bin/env node
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const program = fileURLToPath(import.meta.url).replace("web3-store.js", "cli.js");
console.log("Running", program);

execSync(`node --no-warnings ${program} ` + process.argv.slice(2).join(" "), {
    stdio: "inherit",
    cwd: process.cwd(),
});
