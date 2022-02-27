import fs from "node:fs";
import path from "node:path";

export function readable_size(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    while (bytes >= 1024) {
        bytes /= 1024;
        i++;
    }
    return bytes.toFixed(2) + " " + units[i];
}

export function package_metadata(): Record<string, unknown> {
    const file = path.resolve(__dirname, "..", "package.json");
    return JSON.parse(fs.readFileSync(file, "utf8"));
}
