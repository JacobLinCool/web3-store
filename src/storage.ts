/* eslint-disable @typescript-eslint/ban-ts-comment */
import fs from "node:fs";
import path from "node:path";
import { packToFs } from "ipfs-car/pack/fs";
import ora from "ora";
import { Web3Storage } from "web3.storage";
import { CarReader } from "@ipld/car";
import { decrypt, encrypt } from "./encrypt";
import { readable_size } from "./utils";

function encrypt_files(root: string, relative: string, password = ""): void {
    const files = fs.readdirSync(root);
    for (const file of files) {
        const full = path.join(root, relative, file);
        if (fs.statSync(full).isDirectory()) {
            encrypt_files(root, path.join(relative, file), password);
        } else {
            const data = fs.readFileSync(full);
            const encrypted = encrypt(data, password);
            fs.writeFileSync(path.join(root + ".encrypted", relative, file), encrypted);
        }
    }
}

export async function store(target: string, password = ""): Promise<string> {
    const client = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY || "" });

    const spinner = ora("").start();
    target = path.resolve(target);
    const encrypted = path.resolve(target + ".encrypted");

    try {
        if (password) {
            spinner.text = "Encrypting... | Dir: " + target;
            if (fs.existsSync(encrypted)) {
                fs.rmSync(encrypted, { recursive: true });
            }
            fs.mkdirSync(encrypted);
            encrypt_files(target, "/", password);
        }
        spinner.text = "Packing... | Dir: " + encrypted;
        const { root, filename } = await packToFs({
            input: target + (password ? ".encrypted" : ""),
            output: target + ".car",
        });
        if (password) {
            fs.rmSync(encrypted, { recursive: true });
        }
        spinner.text = "Storing... | CID: " + root;
        const car = await CarReader.fromIterable(fs.createReadStream(filename));

        const total = fs.statSync(filename).size;
        let uploaded = 0;

        const cid = await client.putCar(car, {
            onStoredChunk: (bytes) => {
                uploaded += bytes;
                const progress = Math.min((uploaded / total) * 100, 100).toFixed(2);
                const sizes = readable_size(uploaded) + " / " + readable_size(total);
                spinner.text = `Storing... ${progress}% ( ${sizes} ) | CID: ${root}`;
            },
        });

        fs.rmSync(target + ".car");

        spinner.succeed(`Stored | CID: ${cid}`);
        spinner.info(`       | Check on https://ipfs-scan.io/?cid=${cid}`);
    } catch (err) {
        spinner.fail((err as Error).message);
        if (fs.existsSync(encrypted)) {
            fs.rmSync(encrypted, { recursive: true });
        }
        if (fs.existsSync(target + ".car")) {
            fs.rmSync(target + ".car");
        }
    }
    return "";
}

export async function retrieve(cid: string, target: string, password = ""): Promise<string> {
    const client = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY || "" });

    const spinner = ora("").start();
    target = path.resolve(target);

    try {
        spinner.text = "Download... | CID: " + cid;
        const res = (await client.get(cid)) as unknown as {
            ok: boolean;
            status: number;
            statusText: string;
            files: any;
        };
        if (!res || !res.ok) {
            throw new Error(`Failed to get ${cid} - [${res.status}] ${res.statusText}`);
        }
        const files = await res.files();
        spinner.text = "Decrypting... | CID: " + cid;
        for (const file of files as { cid: string; path: string; size: number; data: any }[]) {
            const data = await file.data();
            if (password) {
                const decrypted = decrypt(data, password);
                fs.writeFileSync(path.join(target, file.path), decrypted);
            } else {
                fs.writeFileSync(path.join(target, file.path), data);
            }
        }
        spinner.succeed(`Retrieved ${cid} | Dir: ${target}`);
    } catch (err) {
        spinner.fail((err as Error).message);
    }
    return "";
}
