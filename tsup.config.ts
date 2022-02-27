import { defineConfig } from "tsup";

export default defineConfig((options) => ({
    entry: ["src/web3-store.ts", "src/index.ts", "src/cli.ts"],
    outDir: "lib",
    target: "node14",
    format: ["cjs", "esm"],
    clean: true,
    splitting: false,
    minify: !options.watch,
    dts: !options.watch,
}));
