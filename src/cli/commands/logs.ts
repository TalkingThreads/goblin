import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { createInterface } from "node:readline";
import { resolveLogPath } from "../../observability/file-destinations.js";

const LEVEL_MAP: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

interface LogOptions {
  path?: string;
  follow?: boolean;
  level?: string;
  json?: boolean;
}

/**
 * Get numeric level value from string or number
 */
function getLevelValue(level: string | number): number {
  if (typeof level === "number") return level;
  if (typeof level === "string") {
    const val = LEVEL_MAP[level.toLowerCase()];
    if (val !== undefined) return val;
    const num = parseInt(level, 10);
    if (!Number.isNaN(num)) return num;
  }
  return 0;
}

/**
 * Filter log line by level
 */
function filterLine(line: string, levelFilter?: string): boolean {
  if (!levelFilter) return true;
  try {
    const parsed = JSON.parse(line);
    const filterValue = getLevelValue(levelFilter);
    const lineLevel = parsed.level;
    const lineValue = getLevelValue(lineLevel);
    return lineValue >= filterValue;
  } catch {
    return true; // Include non-JSON lines or lines we can't parse
  }
}

/**
 * Print a log line with optional formatting
 */
function printLine(line: string, json?: boolean): void {
  if (json) {
    console.log(line);
  } else {
    try {
      const parsed = JSON.parse(line);
      const time = parsed.time ? new Date(parsed.time).toLocaleTimeString() : "";
      const level = parsed.level;
      const levelStr =
        Object.keys(LEVEL_MAP)
          .find((k) => LEVEL_MAP[k] === level)
          ?.toUpperCase() || level;
      const component = parsed.component ? `[${parsed.component}]` : "";
      const msg = parsed.msg || parsed.message || "";
      console.log(`${time} ${String(levelStr).padEnd(5)} ${component} ${msg}`);

      // Print extra data if not too bulky
      const { time: _t, level: _l, component: _c, msg: _m, message: _m2, ...rest } = parsed;
      if (Object.keys(rest).length > 0) {
        console.log("  ", JSON.stringify(rest));
      }
    } catch {
      console.log(line);
    }
  }
}

/**
 * Execute the logs command
 */
export async function logsCommand(options: LogOptions): Promise<void> {
  const defaultPath = "~/.goblin/logs/app.log";
  const logPath = resolveLogPath(options.path || defaultPath);

  if (!existsSync(logPath)) {
    console.error(`Log file not found: ${logPath}`);
    process.exit(1);
  }

  // Initial tail - last 50 lines
  const lines: string[] = [];
  const rl = createInterface({
    input: createReadStream(logPath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (filterLine(line, options.level)) {
      lines.push(line);
      if (lines.length > 50) {
        lines.shift();
      }
    }
  }

  for (const line of lines) {
    printLine(line, options.json);
  }

  if (options.follow) {
    let fileSize = statSync(logPath).size;

    watch(logPath, (event) => {
      if (event === "change") {
        try {
          const stats = statSync(logPath);
          const newSize = stats.size;
          if (newSize > fileSize) {
            const stream = createReadStream(logPath, {
              start: fileSize,
              end: newSize - 1,
            });
            const followRl = createInterface({
              input: stream,
              crlfDelay: Infinity,
            });
            followRl.on("line", (line) => {
              if (filterLine(line, options.level)) {
                printLine(line, options.json);
              }
            });
            fileSize = newSize;
          } else if (newSize < fileSize) {
            // File truncated or rotated
            fileSize = newSize;
          }
        } catch (_err) {
          // File might be temporarily inaccessible
        }
      }
    });

    // Keep process alive
    return new Promise(() => {});
  }
}
