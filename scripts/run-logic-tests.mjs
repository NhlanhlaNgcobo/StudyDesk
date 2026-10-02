/**
 * Logic test runner.
 *
 * The pure logic in lib/ is plain TypeScript, so there is no need for a test
 * framework or a bundler: compile the handful of modules under test to
 * CommonJS, rewrite the `@/` path alias (tsc type-checks it but does not
 * rewrite it on emit), then run the assertions with plain node.
 *
 *   npm test
 */

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(root, ".test-build");

// Only the modules whose logic we assert on, plus what they import.
const SOURCES = [
  "lib/learner-model.ts",
  "lib/cohort.ts",
  "lib/planner.ts",
  "lib/mock-data.ts",
  "lib/claude.ts",
];

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });

// Call the local tsc entry point with node directly - more reliable across
// platforms than shelling out to the npx/.cmd wrapper.
const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

const tsc = spawnSync(
  process.execPath,
  [
    tscBin,
    ...SOURCES,
    "--module", "commonjs",
    "--target", "ES2020",
    "--moduleResolution", "node",
    "--esModuleInterop",
    "--skipLibCheck",
    "--jsx", "react-jsx",
    "--outDir", buildDir,
  ],
  { cwd: root, encoding: "utf8", shell: false }
);

const output = `${tsc.stdout || ""}${tsc.stderr || ""}`;

// TS2307 is expected: tsc cannot resolve the `@/` alias without the project
// tsconfig, but it still emits. Anything else is a genuine compile failure.
const realErrors = output
  .split(/\r?\n/)
  .filter((line) => /error TS/.test(line) && !/error TS2307/.test(line));

if (realErrors.length > 0) {
  console.error("Compile failed:\n" + realErrors.join("\n"));
  process.exit(1);
}

const emitted = readdirSync(buildDir).filter((f) => f.endsWith(".js"));
if (emitted.length === 0) {
  console.error("Compile produced no output.\n" + output);
  process.exit(1);
}

// Rewrite `require("@/lib/x")` -> `require("./x")` in the emitted JS.
for (const file of emitted) {
  const full = path.join(buildDir, file);
  const patched = readFileSync(full, "utf8").replace(
    /require\("@\/lib\/([^"]+)"\)/g,
    'require("./$1")'
  );
  writeFileSync(full, patched);
}

const run = spawnSync(process.execPath, [path.join(root, "tests", "logic.test.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, SD_TEST_BUILD: buildDir },
});

process.exit(run.status ?? 1);
