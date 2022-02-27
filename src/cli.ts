import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import { config } from "dotenv";
import { decrypt, encrypt } from "./encrypt";
import { retrieve, store } from "./storage";
import { package_metadata } from "./utils";

const metadata = package_metadata();
program.version(`${metadata.name as string} v${metadata.version as string}`);

program
    .option("-s, --secrets <path>", "Path to secret file", ".env")
    .option("-p, --password <password>", "Password to encrypt/decrypt", "");

program
    .command("store <target>")
    .description("Encrypt & store target directory to IPFS")
    .action(async (target) => {
        const options = program.opts();
        config({ path: path.resolve(options.secrets) });
        const password = options.password || process.env.ENCRYPTION_PASSWORD || "";

        if (fs.lstatSync(target).isDirectory()) {
            await store(target, password);
        } else {
            const tempdir = fs.mkdtempSync("web3-store-tmp-");
            fs.copyFileSync(target, path.resolve(tempdir, path.basename(target)));
            await store(tempdir, password);
            fs.rmdirSync(tempdir, { recursive: true });
        }
    });

program
    .command("retrieve <cid>")
    .description("Retrieve & decrypt target directory from IPFS")
    .action(async (cid) => {
        const options = program.opts();
        config({ path: path.resolve(options.secrets) });
        const password = options.password || process.env.ENCRYPTION_PASSWORD || "";
        await retrieve(cid, password);
    });

program
    .command("encrypt <target>")
    .description("Encrypt target file")
    .action((target) => {
        const options = program.opts();
        config({ path: path.resolve(options.secrets) });
        const password = options.password || process.env.ENCRYPTION_PASSWORD || "";
        fs.writeFileSync(target + ".encrypted", encrypt(fs.readFileSync(target), password));
    });

program
    .command("decrypt <target>")
    .description("Decrypt target file")
    .action((target) => {
        const options = program.opts();
        config({ path: path.resolve(options.secrets) });
        const password = options.password || process.env.ENCRYPTION_PASSWORD || "";
        fs.writeFileSync(
            target.endsWith(".encrypted")
                ? target.replace(".encrypted", "")
                : target + ".decrypted",
            decrypt(fs.readFileSync(target), password),
        );
    });

program.parse();
