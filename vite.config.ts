import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["tests/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
		coverage: { include: ["src/contexts/**/*.?(c|m)[jt]s?(x)"] },
	},
});
