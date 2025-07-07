import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
		coverage: { include: ["src/contexts/**/*.?(c|m)[jt]s?(x)"] },
		testTimeout: 10000,
		environment: "jsdom",
		globals: true,
		setupFiles: "./src/setupTests.ts",
	},
});
