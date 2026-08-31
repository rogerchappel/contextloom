#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import os from "node:os";
import path from "node:path";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
const lockRoot = packageLock.packages?.[""];

for (const field of ["name", "version", "bin"]) {
  if (!isDeepStrictEqual(lockRoot?.[field], packageJson[field])) {
    throw new Error(
      `package-lock.json root ${field} metadata does not match package.json: ` +
        `${JSON.stringify(lockRoot?.[field])} !== ${JSON.stringify(packageJson[field])}`,
    );
  }
}

const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "contextloom-package-smoke-"));

try {
  const output = execFileSync("npm", ["pack", "--json", "--pack-destination", temporaryDirectory], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  const [packument] = JSON.parse(output);
  const packedFiles = new Set(packument.files.map((file) => file.path));
  const requiredFiles = new Set(["README.md", "LICENSE"]);

  if (packageJson.main) {
    requiredFiles.add(packageJson.main.replace(/^\.\//, ""));
  }

  const binEntries =
    typeof packageJson.bin === "string"
      ? [packageJson.bin]
      : Object.values(packageJson.bin ?? {});

  for (const binEntry of binEntries) {
    requiredFiles.add(binEntry.replace(/^\.\//, ""));
  }

  const missing = [...requiredFiles].filter((file) => !packedFiles.has(file));
  if (missing.length > 0) {
    throw new Error(`${packageJson.name} package smoke failed; missing packed file(s): ${missing.join(", ")}`);
  }

  const archive = path.join(temporaryDirectory, packument.filename);
  execFileSync("tar", ["-xzf", archive, "-C", temporaryDirectory]);
  const packagedCli = path.join(temporaryDirectory, "package", "dist", "src", "cli.js");
  const invalid = spawnSync(process.execPath, [packagedCli, "inspect", "fixtures/sample", "--format", "yaml"], {
    encoding: "utf8",
  });
  if (invalid.status === 0 || !/--format must be json or markdown/.test(invalid.stderr) || !/Usage:/.test(invalid.stderr)) {
    throw new Error(`packed CLI did not reject an unsupported format:\n${invalid.stderr}`);
  }

  const structuredInput = path.join(temporaryDirectory, "structured-input");
  const structuredOutput = path.join(temporaryDirectory, "structured-output");
  await mkdir(structuredInput);
  await writeFile(path.join(structuredInput, "messages.jsonl"), [
    JSON.stringify({ role: "user", content: "escaped \"string\"" }),
    JSON.stringify({ role: "assistant", content: [{ type: "text", text: "array content" }] }),
    JSON.stringify({ role: "tool", content: { text: "object content", ok: true } }),
  ].join("\n") + "\n");
  const inspected = spawnSync(process.execPath, [packagedCli, "inspect", structuredInput, "--output", structuredOutput, "--format", "json"], { encoding: "utf8" });
  if (inspected.status !== 0 || !/array content/.test(inspected.stdout) || !/object content/.test(inspected.stdout)) {
    throw new Error(`packed CLI did not index structured transcript content:\n${inspected.stderr}`);
  }
  const verified = spawnSync(process.execPath, [packagedCli, "verify", path.join(structuredOutput, "manifest.json"), "--format", "json"], { encoding: "utf8" });
  if (verified.status !== 0 || !/"ok": true/.test(verified.stdout)) {
    throw new Error(`packed CLI did not verify structured transcript citations:\n${verified.stderr}`);
  }

  console.log(`${packageJson.name} package smoke passed with ${packument.files.length} packed file(s), strict CLI validation, and structured transcript verification.`);
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
