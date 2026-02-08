/**
 * Memory Monitor for Performance Tests
 *
 * Monitors memory usage and detects leaks during extended operations.
 */

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
}

export interface MemoryResult {
  initialSnapshot: MemorySnapshot;
  finalSnapshot: MemorySnapshot;
  peakSnapshot: MemorySnapshot;
  snapshots: MemorySnapshot[];
  growthBytes: number;
  growthPercent: number;
  averageGrowthRate: number;
  leakedObjects: LeakedObject[];
}

export interface LeakedObject {
  type: string;
  count: number;
  size: number;
  stackTrace?: string;
}

export interface MemoryConfig {
  intervalMs: number;
  sampleCount?: number;
  warmupSamples?: number;
  onProgress?: (snapshot: MemorySnapshot, sampleNumber: number, totalSamples: number) => void;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private createSnapshot(): MemorySnapshot {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers || 0,
      rss: usage.rss,
    };
  }

  async monitor(duration: number, config: MemoryConfig): Promise<MemoryResult> {
    this.snapshots = [];
    this.isMonitoring = true;

    const intervalMs = config.intervalMs;
    const maxSamples = config.sampleCount || Math.floor(duration / intervalMs);
    const warmupSamples = config.warmupSamples || 3;

    return new Promise((resolve) => {
      let sampleCount = 0;
      let peakSnapshot = this.getEmptySnapshot();
      const onProgress = config.onProgress;

      const collectMemory = () => {
        if (!this.isMonitoring) return;

        const snapshot = this.createSnapshot();
        this.snapshots.push(snapshot);
        sampleCount++;

        if (onProgress) {
          onProgress(snapshot, sampleCount, maxSamples);
        }

        if (snapshot.heapUsed > peakSnapshot.heapUsed) {
          peakSnapshot = snapshot;
        }

        if (sampleCount < maxSamples) {
          this.intervalId = setTimeout(collectMemory, intervalMs);
        } else {
          this.stop();
          resolve(this.analyzeResults(peakSnapshot, warmupSamples));
        }
      };

      collectMemory();
    });
  }

  startContinuousMonitor(config: MemoryConfig): void {
    this.snapshots = [];
    this.isMonitoring = true;
    const onProgress = config.onProgress;

    const collectMemory = () => {
      if (!this.isMonitoring) return;

      const snapshot = this.createSnapshot();
      this.snapshots.push(snapshot);

      if (onProgress) {
        onProgress(snapshot, this.snapshots.length, Infinity);
      }

      this.intervalId = setTimeout(collectMemory, config.intervalMs);
    };

    collectMemory();
  }

  stop(): void {
    this.isMonitoring = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  takeSnapshot(): MemorySnapshot {
    return this.createSnapshot();
  }

  getCurrentUsage(): MemorySnapshot {
    return this.takeSnapshot();
  }

  async detectLeaks(operation: () => Promise<void>, _config: MemoryConfig): Promise<MemoryResult> {
    const initialSnapshot = this.takeSnapshot();
    await operation();
    const finalSnapshot = this.takeSnapshot();

    return {
      initialSnapshot,
      finalSnapshot,
      peakSnapshot: finalSnapshot,
      snapshots: [initialSnapshot, finalSnapshot],
      growthBytes: finalSnapshot.heapUsed - initialSnapshot.heapUsed,
      growthPercent:
        ((finalSnapshot.heapUsed - initialSnapshot.heapUsed) / initialSnapshot.heapUsed) * 100,
      averageGrowthRate: 0,
      leakedObjects: [],
    };
  }

  private analyzeResults(peakSnapshot: MemorySnapshot, warmupSamples: number): MemoryResult {
    const validSnapshots = this.snapshots.slice(warmupSamples);

    if (validSnapshots.length === 0) {
      return {
        initialSnapshot: this.snapshots[0] || this.getEmptySnapshot(),
        finalSnapshot: this.snapshots[this.snapshots.length - 1] || this.getEmptySnapshot(),
        peakSnapshot,
        snapshots: this.snapshots,
        growthBytes: 0,
        growthPercent: 0,
        averageGrowthRate: 0,
        leakedObjects: [],
      };
    }

    const initialSnapshot = validSnapshots[0];
    const finalSnapshot = validSnapshots[validSnapshots.length - 1];
    const duration = finalSnapshot.timestamp - initialSnapshot.timestamp;
    const growthBytes = finalSnapshot.heapUsed - initialSnapshot.heapUsed;
    const growthPercent = (growthBytes / initialSnapshot.heapUsed) * 100;
    const averageGrowthRate = duration > 0 ? (growthBytes / duration) * 1000 : 0;

    return {
      initialSnapshot,
      finalSnapshot,
      peakSnapshot,
      snapshots: this.snapshots,
      growthBytes,
      growthPercent,
      averageGrowthRate,
      leakedObjects: this.detectLeakedObjects(),
    };
  }

  private detectLeakedObjects(): LeakedObject[] {
    return [];
  }

  private getEmptySnapshot(): MemorySnapshot {
    return {
      timestamp: Date.now(),
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0,
      rss: 0,
    };
  }

  getGrowthTrend(): "stable" | "growing" | "shrinking" {
    if (this.snapshots.length < 3) return "stable";

    const firstHalf = this.snapshots.slice(0, Math.floor(this.snapshots.length / 2));
    const secondHalf = this.snapshots.slice(Math.floor(this.snapshots.length / 2));

    const firstAvg = firstHalf.reduce((sum, s) => sum + s.heapUsed, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.heapUsed, 0) / secondHalf.length;

    const growth = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (growth > 5) return "growing";
    if (growth < -5) return "shrinking";
    return "stable";
  }

  getMemoryStats(): {
    min: number;
    max: number;
    average: number;
    stdDev: number;
  } {
    if (this.snapshots.length === 0) {
      return { min: 0, max: 0, average: 0, stdDev: 0 };
    }

    const values = this.snapshots.map((s) => s.heapUsed);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const squaredDiffs = values.map((v) => (v - average) ** 2);
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return { min, max, average, stdDev };
  }
}

export const memoryMonitor = new MemoryMonitor();
