import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type PatternFile = {
  description?: string;
  patterns: string[];
};

type ChangedFile = {
  status: string;
  paths: string[];
  path: string;
};

type Options = {
  baseRef: string;
  sourceRef: string;
  out?: string;
};

let repoRoot = process.cwd();
repoRoot = git(["rev-parse", "--show-toplevel"]);

function git(args: string[], allowFailure = false): string {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot || process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (!allowFailure) throw error;
    const err = error as { stdout?: Buffer | string; stderr?: Buffer | string };
    const stdout = err.stdout?.toString() ?? "";
    const stderr = err.stderr?.toString() ?? "";
    return `${stdout}${stderr}`.trim();
  }
}

function parseOptions(argv: string[]): Options {
  const options: Options = {
    baseRef: "HEAD",
    sourceRef: "source/main",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--base" && next) {
      options.baseRef = next;
      i += 1;
    } else if (arg === "--source" && next) {
      options.sourceRef = next;
      i += 1;
    } else if (arg === "--out" && next) {
      options.out = next;
      i += 1;
    } else if (arg === "--help") {
      process.stdout.write(`Usage:
  pnpm source-sync:report [--base HEAD] [--source source/main] [--out path]
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function readPatterns(relativePath: string): string[] {
  const absolutePath = path.join(repoRoot, relativePath);
  const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as PatternFile;
  return parsed.patterns;
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

function patternToRegex(pattern: string): RegExp {
  const normalized = normalizePath(pattern);
  const parts = normalized.split("/");
  const regexParts = parts.map((part) => {
    if (part === "**") return "(?:[^/]+/)*";
    return part.split("*").map(escapeRegex).join("[^/]*");
  });
  return new RegExp(`^${regexParts.join("/")}$`);
}

function matchesAny(filePath: string, patterns: string[]): boolean {
  const normalized = normalizePath(filePath);
  return patterns.some((pattern) => {
    const normalizedPattern = normalizePath(pattern);
    if (normalizedPattern.endsWith("/**")) {
      const prefix = normalizedPattern.slice(0, -3);
      return normalized === prefix || normalized.startsWith(`${prefix}/`);
    }
    return patternToRegex(normalizedPattern).test(normalized);
  });
}

function parseChangedFiles(diffNameStatus: string): ChangedFile[] {
  if (!diffNameStatus) return [];
  return diffNameStatus.split(/\r?\n/).map((line) => {
    const parts = line.split("\t");
    const [status, ...paths] = parts;
    const filePath = paths.at(-1) ?? "";
    return {
      status,
      paths,
      path: normalizePath(filePath),
    };
  });
}

function bucketFor(filePath: string): string {
  const parts = filePath.split("/");
  if (parts[0] === "templates" && parts[1]) return `templates/${parts[1]}`;
  if (parts[0] === "packages" && parts[1]) return `packages/${parts[1]}`;
  if (parts[0] === ".github") return ".github";
  if (parts[0] === ".agents") return ".agents";
  return parts[0] || "(root)";
}

function formatList(items: string[], limit = 80): string {
  if (items.length === 0) return "- None\n";
  const visible = items
    .slice(0, limit)
    .map((item) => `- ${item}`)
    .join("\n");
  const remaining = items.length - limit;
  return remaining > 0
    ? `${visible}\n- ...and ${remaining} more\n`
    : `${visible}\n`;
}

function currentDateSlug(): string {
  return new Date().toISOString().slice(0, 10);
}

function conflictFiles(mergeTreeOutput: string): string[] {
  return mergeTreeOutput
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^CONFLICT \([^)]+\): .* in (.+)$/);
      return match?.[1];
    })
    .filter((value): value is string => Boolean(value));
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const protectedPatterns = readPatterns(
    "_ops/source-sync/fixtures/protected-paths.json",
  );
  const registryPatterns = readPatterns(
    "_ops/source-sync/fixtures/registry-paths.json",
  );

  const baseSha = git(["rev-parse", options.baseRef]);
  const sourceSha = git(["rev-parse", options.sourceRef]);
  const mergeBase = git(["merge-base", options.baseRef, options.sourceRef]);
  const aheadBehind = git([
    "rev-list",
    "--left-right",
    "--count",
    `${options.baseRef}...${options.sourceRef}`,
  ]);
  const [baseAhead, sourceAhead] = aheadBehind.split(/\s+/);

  const changedFiles = parseChangedFiles(
    git(["diff", "--name-status", `${options.baseRef}..${options.sourceRef}`]),
  );
  const protectedChanges = changedFiles.filter((file) =>
    matchesAny(file.path, protectedPatterns),
  );
  const registryChanges = changedFiles.filter((file) =>
    matchesAny(file.path, registryPatterns),
  );

  const buckets = new Map<string, number>();
  for (const file of changedFiles) {
    const key = bucketFor(file.path);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const bucketLines = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([bucket, count]) => `- ${bucket}: ${count}`);

  const upstreamCommits = git([
    "log",
    "--oneline",
    "--max-count=60",
    `${options.baseRef}..${options.sourceRef}`,
  ]);
  const mergeTreeOutput = git(
    ["merge-tree", options.baseRef, options.sourceRef],
    true,
  );
  const conflicts = conflictFiles(mergeTreeOutput);

  const report = `# Source Sync Report - ${currentDateSlug()}

## Summary

- Base ref: \`${options.baseRef}\` (${baseSha})
- Source ref: \`${options.sourceRef}\` (${sourceSha})
- Merge base: \`${mergeBase}\`
- Base-only commits: ${baseAhead}
- Source-only commits: ${sourceAhead}
- Changed files from base to source: ${changedFiles.length}
- Protected-path changes: ${protectedChanges.length}
- Registry-lane changes: ${registryChanges.length}
- Dry-merge conflicts: ${conflicts.length}

## Recommendation

Do not merge source directly into Jami \`main\`. Review protected-path changes
first, port high-value upstream changes by lane, and keep Jami takeover decisions
intact unless explicitly reversed.

## Changed Files By Area

${bucketLines.length > 0 ? bucketLines.join("\n") : "- None"}

## Protected-Path Changes

${formatList(
  protectedChanges.map((file) => `${file.status} ${file.path}`),
  120,
)}
## Registry-Lane Changes

${formatList(
  registryChanges.map((file) => `${file.status} ${file.path}`),
  120,
)}
## Dry-Merge Conflicts

${formatList(conflicts, 120)}
## Upstream Commits

${upstreamCommits
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => `- ${line}`)
  .join("\n")}
`;

  const defaultOut = `_ops/source-sync/reports/${currentDateSlug()}-upstream-sync.md`;
  const outPath = path.join(repoRoot, normalizePath(options.out ?? defaultOut));
  const outDir = path.dirname(outPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, report, "utf8");
  process.stdout.write(`${path.relative(repoRoot, outPath)}\n`);
}

main();
