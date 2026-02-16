import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

interface CoverageThresholds {
  warning: number;
  blocking: number;
}

interface CoverageConfig {
  thresholds: CoverageThresholds;
  exclude?: string[];
  reporter?: string;
  reporters?: string[];
  outputDir?: string;
}

const DEFAULT_CONFIG: CoverageConfig = {
  thresholds: {
    warning: 70,
    blocking: 60,
  },
  exclude: [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/tests/**",
    "**/*.config.ts",
    "**/*.config.js",
    "**/test-config.ts",
    "**/smoke.config.ts",
  ],
  reporter: "text",
  reporters: ["text", "json"],
  outputDir: "coverage",
};

function getProjectRoot(): string {
  return resolve(process.cwd());
}

async function loadConfig(): Promise<CoverageConfig> {
  const configPath = resolve(getProjectRoot(), "coverage.config.json");
  try {
    const content = await readFile(configPath, "utf-8");
    const config = JSON.parse(content) as Partial<CoverageConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...config.thresholds,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

interface CoverageStats {
  lines: number;
  linesCovered: number;
  linesUncovered: number;
  linesPercent: number;
  functions: number;
  functionsCovered: number;
  functionsUncovered: number;
  functionsPercent: number;
  branches: number;
  branchesCovered: number;
  branchesUncovered: number;
  branchesPercent: number;
}

interface CoverageReport {
  success: boolean;
  timestamp: string;
  summary: CoverageStats;
  files?: CoverageFile[];
}

interface CoverageFile {
  path: string;
  linesPercent: number;
  functionsPercent: number;
  branchesPercent: number;
}

function parseTextCoverage(output: string): CoverageReport {
  const lines = output.split("\n");
  const report: CoverageReport = {
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      lines: 0,
      linesCovered: 0,
      linesUncovered: 0,
      linesPercent: 0,
      functions: 0,
      functionsCovered: 0,
      functionsUncovered: 0,
      functionsPercent: 0,
      branches: 0,
      branchesCovered: 0,
      branchesUncovered: 0,
      branchesPercent: 0,
    },
    files: [],
  };

  let inFileSection = false;
  let filePath = "";
  const fileData: CoverageFile[] = [];

  for (const line of lines) {
    const lineTrimmed = line.trim();

    if (lineTrimmed.startsWith("File:")) {
      inFileSection = true;
      const match = lineTrimmed.match(/File:\s+(.+)/);
      if (match) {
        filePath = match[1];
      }
      continue;
    }

    if (inFileSection && lineTrimmed.startsWith("|")) {
      const parts = lineTrimmed.split("|").map((p) => p.trim());
      if (parts.length >= 6 && parts[1]) {
        const percentMatch = parts[4].match(/(\d+\.?\d*)%/);
        const percent = percentMatch ? parseFloat(percentMatch[1]) : 0;

        if (filePath) {
          fileData.push({
            path: filePath,
            linesPercent: percent,
            functionsPercent: 0,
            branchesPercent: 0,
          });
          filePath = "";
        }
      }
    }

    if (lineTrimmed.startsWith("Total:") || lineTrimmed.startsWith("All files")) {
      inFileSection = false;
      const totalMatch = lineTrimmed.match(
        /\|\s*(\d+\.?\d*)\s*\|\s*(\d+\.?\d*)\s*\|/,
      );
      if (totalMatch) {
        report.summary.functionsPercent = parseFloat(totalMatch[1]);
        report.summary.linesPercent = parseFloat(totalMatch[2]);
      }
    }
  }

  report.files = fileData;
  return report;
}

async function runCoverage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const coverageArgs = ["test", "tests/unit", "--coverage"];

    const proc = spawn("bun", coverageArgs, {
      cwd: getProjectRoot(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      const combined = stdout + stderr;
      if (code === 0 || combined.includes("Coverage") || combined.includes("All files")) {
        resolve(combined);
      } else {
        reject(new Error(stderr || `Coverage failed with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

function printTextSummary(report: CoverageReport, config: CoverageConfig): void {
  const percent = report.summary.linesPercent;
  const threshold = config.thresholds;

  const reset = "\x1b[0m";
  const red = "\x1b[31m";
  const yellow = "\x1b[33m";
  const green = "\x1b[32m";

  let statusColor = green;
  let statusText = "PASS";

  if (percent < threshold.blocking) {
    statusColor = red;
    statusText = "FAIL";
  } else if (percent < threshold.warning) {
    statusColor = yellow;
    statusText = "WARN";
  }

  console.log("\n" + "=".repeat(50));
  console.log("Coverage Report".padEnd(50) + "|");
  console.log("=".repeat(50));
  console.log(
    `Lines: ${report.summary.linesCovered}/${report.summary.lines} (${percent.toFixed(2)}%)`.padEnd(
      51,
    ) + "|",
  );
  console.log(
    `Functions: ${report.summary.functionsCovered}/${report.summary.functions} (${report.summary.functionsPercent.toFixed(2)}%)`.padEnd(
      51,
    ) + "|",
  );
  console.log(
    `Branches: ${report.summary.branchesCovered}/${report.summary.branches} (${report.summary.branchesPercent.toFixed(2)}%)`.padEnd(
      51,
    ) + "|",
  );
  console.log("=".repeat(50));
  console.log(
    `${statusColor}Status: ${statusText}${reset} | Warning: >=${threshold.warning}% | Blocking: >=${threshold.blocking}%`,
  );
  console.log("=".repeat(50));

  if (report.files && report.files.length > 0) {
    const lowCoverage = report.files
      .filter((f) => f.linesPercent < threshold.warning)
      .sort((a, b) => a.linesPercent - b.linesPercent)
      .slice(0, 10);

    if (lowCoverage.length > 0) {
      console.log(`\n${yellow}Files below warning threshold (${threshold.warning}%):${reset}`);
      for (const file of lowCoverage) {
        const fileColor = file.linesPercent < threshold.blocking ? red : yellow;
        console.log(
          `  ${fileColor}${file.linesPercent.toFixed(1)}%${reset} ${file.path}`,
        );
      }
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const config = await loadConfig();

  const isJson = args.includes("--json");
  const isQuiet = args.includes("--quiet");

  try {
    if (!isQuiet) {
      console.log("Running coverage analysis...");
    }

    const output = await runCoverage();
    const report = parseTextCoverage(output);

    if (isJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printTextSummary(report, config);
    }

    const percent = report.summary.linesPercent;
    const threshold = config.thresholds;

    if (percent < threshold.warning) {
      console.log(`\n⚠️  Coverage is below warning threshold (${threshold.warning}%)`);
    }

    if (percent < threshold.blocking) {
      process.exit(1);
    }
  } catch (error) {
    if (isJson) {
      console.log(
        JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    } else {
      console.error("Coverage analysis failed:", error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}

main();
