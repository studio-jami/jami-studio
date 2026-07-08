import { execFileSync } from "node:child_process";

let repoRoot = process.cwd();
repoRoot = git(["rev-parse", "--show-toplevel"]);

function git(args: string[]): string {
  process.stdout.write(`git ${args.join(" ")}\n`);
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function remoteUrl(name: string): string | undefined {
  try {
    return execFileSync("git", ["remote", "get-url", name], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function assertRemote(name: string, expectedIncludes: string) {
  const url = remoteUrl(name);
  if (!url?.includes(expectedIncludes)) {
    throw new Error(
      `Expected remote '${name}' to include '${expectedIncludes}', got '${url ?? "missing"}'.`,
    );
  }
}

assertRemote("upstream", "github.com/BuilderIO/agent-native");
assertRemote("source", "github.com/studio-jami/agent-native-source");

git(["fetch", "--prune", "upstream", "main"]);
git(["push", "source", "upstream/main:main"]);

const sourceSha = git(["rev-parse", "upstream/main"]);
process.stdout.write(`source mirror refreshed to ${sourceSha}\n`);
