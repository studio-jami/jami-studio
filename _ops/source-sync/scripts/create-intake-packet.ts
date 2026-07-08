import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type Options = {
  baseBranch: string;
  sourceRef: string;
  branch?: string;
  createPr: boolean;
};

let repoRoot = process.cwd();
repoRoot = git(["rev-parse", "--show-toplevel"]);

function git(args: string[], allowFailure = false): string {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (!allowFailure) throw error;
    const err = error as { stdout?: Buffer | string; stderr?: Buffer | string };
    return `${err.stdout?.toString() ?? ""}${err.stderr?.toString() ?? ""}`.trim();
  }
}

function run(args: string[]) {
  process.stdout.write(`git ${args.join(" ")}\n`);
  execFileSync("git", args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function runCommand(command: string, args: string[]) {
  process.stdout.write(`${command} ${args.join(" ")}\n`);
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    baseBranch: "sync/staging",
    sourceRef: "source/main",
    createPr: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) {
      options.baseBranch = next;
      i += 1;
    } else if (arg === "--source" && next) {
      options.sourceRef = next;
      i += 1;
    } else if (arg === "--branch" && next) {
      options.branch = next;
      i += 1;
    } else if (arg === "--create-pr") {
      options.createPr = true;
    } else if (arg === "--help") {
      process.stdout.write(`Usage:
  pnpm source-sync:intake [--base sync/staging] [--source source/main] [--branch sync/intake/<sha>] [--create-pr]
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function assertCleanWorktree() {
  const status = git(["status", "--porcelain"]);
  if (status) {
    throw new Error(
      `Working tree must be clean before creating an intake packet:\n${status}`,
    );
  }
}

function remoteBranchExists(branch: string): boolean {
  const output = git(["ls-remote", "--heads", "origin", branch]);
  return Boolean(output);
}

function localBranchExists(branch: string): boolean {
  const output = git(["branch", "--list", branch]);
  return Boolean(output);
}

function hasStagedChanges(): boolean {
  try {
    execFileSync("git", ["diff", "--cached", "--quiet"], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    return false;
  } catch {
    return true;
  }
}

function currentDateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

function writePacket({
  shortSha,
  sourceSha,
  sourceRef,
  baseBranch,
  reportPath,
}: {
  shortSha: string;
  sourceSha: string;
  sourceRef: string;
  baseBranch: string;
  reportPath: string;
}) {
  const packetDir = path.join(repoRoot, "_ops/source-sync/intake", shortSha);
  if (!existsSync(packetDir)) mkdirSync(packetDir, { recursive: true });
  const packetPath = path.join(packetDir, "agent-instructions.md");
  const body = `# Source Sync Intake - ${shortSha}

## Inputs

- Source ref: \`${sourceRef}\`
- Source SHA: \`${sourceSha}\`
- Base branch: \`${baseBranch}\`
- Report: \`${reportPath}\`

## Agent Job

Prepare a curated upstream intake merge for Jami Studio.

Read these first:

- \`_ops/source-sync/hard-rules.md\`
- \`_ops/source-sync/policy.md\`
- \`${reportPath}\`

Accept upstream source by default on this branch. The branch separation is the
safety layer; size alone is not a reason to defer.

Strip or adapt only obvious Jami takeover contradictions:

- inherited Builder GitHub workflows
- Builder publish, deploy, billing, or dispatch automation
- root repo identity, branding, domain, legal, OAuth, or ownership assumptions
- changes that delete or replace Jami \`_ops/source-sync\` machinery

If a decision is ambiguous, document it in this folder for human review instead
of silently dropping upstream code.

## Expected Output

- Upstream merged into this intake branch with contradictions stripped or
  adapted.
- Notes for accepted, adapted, and human-review-needed changes.
- A PR from this branch into \`${baseBranch}\`.
`;
  writeFileSync(packetPath, body, "utf8");
}

function createOrUpdatePr(
  branch: string,
  baseBranch: string,
  shortSha: string,
) {
  const repo = git(["remote", "get-url", "origin"])
    .replace(/\.git$/, "")
    .split("/")
    .slice(-2)
    .join("/");
  const owner = repo.split("/")[0];
  const headRef = `${owner}:${branch}`;
  const existingPr = execFileSync(
    "gh",
    [
      "pr",
      "list",
      "--repo",
      repo,
      "--head",
      headRef,
      "--base",
      baseBranch,
      "--state",
      "open",
      "--json",
      "url",
      "--jq",
      ".[0].url // empty",
    ],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  ).trim();

  if (existingPr) {
    process.stdout.write(`existing PR: ${existingPr}\n`);
    return;
  }

  const body = `Pre-merge source-sync intake packet for upstream \`${shortSha}\`.

This PR is the workspace for agent curation before anything lands in \`${baseBranch}\`.

Review packet:
\`_ops/source-sync/intake/${shortSha}/agent-instructions.md\`
`;

  runCommand("gh", [
    "pr",
    "create",
    "--repo",
    repo,
    "--base",
    baseBranch,
    "--head",
    headRef,
    "--title",
    `Source sync intake ${shortSha}`,
    "--body",
    body,
  ]);
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  assertCleanWorktree();

  run(["fetch", "origin", options.baseBranch]);
  run(["fetch", "source", "main"]);

  const sourceSha = git(["rev-parse", options.sourceRef]);
  const shortSha = sourceSha.slice(0, 7);
  const branch = options.branch ?? `sync/intake/${shortSha}`;
  const baseRef = `origin/${options.baseBranch}`;

  if (remoteBranchExists(branch)) {
    run(["fetch", "origin", branch]);
    if (localBranchExists(branch)) {
      run(["checkout", branch]);
      run(["merge", "--ff-only", `origin/${branch}`]);
    } else {
      run(["checkout", "-b", branch, `origin/${branch}`]);
    }
  } else {
    run(["checkout", "-b", branch, baseRef]);
  }

  run(["merge", "--ff-only", baseRef]);

  const reportPath = `_ops/source-sync/reports/${currentDateSlug()}-${shortSha}-intake.md`;
  runCommand("node", [
    "--experimental-strip-types",
    "_ops/source-sync/scripts/source-sync-report.ts",
    "--base",
    baseRef,
    "--source",
    options.sourceRef,
    "--out",
    reportPath,
  ]);

  writePacket({
    shortSha,
    sourceSha,
    sourceRef: options.sourceRef,
    baseBranch: options.baseBranch,
    reportPath,
  });

  run(["add", reportPath, `_ops/source-sync/intake/${shortSha}`]);
  if (hasStagedChanges()) {
    run(["commit", "-m", `source-sync: prepare intake ${shortSha}`]);
  } else {
    process.stdout.write("intake packet already up to date\n");
  }
  run(["push", "-u", "origin", branch]);

  if (options.createPr) {
    createOrUpdatePr(branch, options.baseBranch, shortSha);
  }

  process.stdout.write(`intake branch ready: ${branch}\n`);
}

main();
