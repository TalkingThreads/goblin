/**
 * Tool Discovery Filtering Smoke Tests
 *
 * Tests for filtering tools during discovery
 */

import { describe, expect, it } from "bun:test";

describe("Tool Discovery Filtering", () => {
  const allTools = [
    { name: "file_read", backend: "fs-server" },
    { name: "file_write", backend: "fs-server" },
    { name: "git_status", backend: "git-server" },
    { name: "git_commit", backend: "git-server" },
    { name: "db_query", backend: "db-server" },
  ];

  it("should filter tools by prefix", async () => {
    const prefix = "file_";
    const filtered = allTools.filter((t) => t.name.startsWith(prefix));

    expect(filtered.length).toBe(2);
    expect(filtered.every((t) => t.name.startsWith(prefix))).toBe(true);
    expect(filtered.map((t) => t.name)).toContain("file_read");
    expect(filtered.map((t) => t.name)).toContain("file_write");
  });

  it("should filter tools by backend", async () => {
    const backend = "git-server";
    const filtered = allTools.filter((t) => t.backend === backend);

    expect(filtered.length).toBe(2);
    expect(filtered.every((t) => t.backend === backend)).toBe(true);
    expect(filtered.map((t) => t.name)).toContain("git_status");
    expect(filtered.map((t) => t.name)).toContain("git_commit");
  });

  it("should return all tools when filter is empty", async () => {
    const filters = { prefix: "", backend: "" };
    const filtered = allTools.filter((t) => {
      const matchPrefix = !filters.prefix || t.name.startsWith(filters.prefix);
      const matchBackend = !filters.backend || t.backend === filters.backend;
      return matchPrefix && matchBackend;
    });

    expect(filtered.length).toBe(allTools.length);
    expect(filtered).toEqual(allTools);
  });

  it("should support filter combinations", async () => {
    const filters = { prefix: "git_", backend: "git-server" };
    const filtered = allTools.filter((t) => {
      const matchPrefix = !filters.prefix || t.name.startsWith(filters.prefix);
      const matchBackend = !filters.backend || t.backend === filters.backend;
      return matchPrefix && matchBackend;
    });

    expect(filtered.length).toBe(2);
    expect(filtered.every((t) => t.name.startsWith("git_") && t.backend === "git-server")).toBe(
      true,
    );
  });

  it("should return empty list when no tools match combination", async () => {
    const filters = { prefix: "file_", backend: "git-server" };
    const filtered = allTools.filter((t) => {
      const matchPrefix = !filters.prefix || t.name.startsWith(filters.prefix);
      const matchBackend = !filters.backend || t.backend === filters.backend;
      return matchPrefix && matchBackend;
    });

    expect(filtered.length).toBe(0);
  });
});
