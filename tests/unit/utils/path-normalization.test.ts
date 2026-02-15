import { describe, expect, test } from "bun:test";
import {
  looksLikePath,
  normalizeArgs,
  normalizePath,
} from "../../../src/utils/path-normalization.js";

describe("Path Normalization Utils", () => {
  describe("looksLikePath", () => {
    test("should detect Windows absolute paths", () => {
      expect(looksLikePath("C:\\Users\\name")).toBe(true);
      expect(looksLikePath("D:/Projects")).toBe(true);
    });

    test("should detect Unix absolute paths", () => {
      expect(looksLikePath("/home/user")).toBe(true);
      expect(looksLikePath("/etc/config")).toBe(true);
    });

    test("should detect UNC paths", () => {
      expect(looksLikePath("\\\\server\\share")).toBe(true);
    });

    test("should detect Registry paths", () => {
      expect(looksLikePath("HKEY_LOCAL_MACHINE\\Software")).toBe(true);
    });

    test("should detect relative paths with separators", () => {
      expect(looksLikePath(".\\config")).toBe(true);
      expect(looksLikePath("./config")).toBe(true);
    });

    test("should catch strings with backslashes", () => {
      expect(looksLikePath("src\\utils\\test.ts")).toBe(true);
      expect(looksLikePath("some\\path")).toBe(true);
    });

    test("should ignore URLs", () => {
      expect(looksLikePath("http://example.com")).toBe(false);
      expect(looksLikePath("https://api.github.com")).toBe(false);
      expect(looksLikePath("file:///path/to/file")).toBe(false);
      expect(looksLikePath("s3://bucket/key")).toBe(false);
    });

    test("should ignore plain strings without separators", () => {
      expect(looksLikePath("filename")).toBe(false);
      expect(looksLikePath("simple-string")).toBe(false);
    });
  });

  describe("normalizePath", () => {
    test("should convert backslashes to forward slashes", () => {
      expect(normalizePath("C:\\Users\\name")).toBe("C:/Users/name");
      expect(normalizePath("\\\\server\\share")).toBe("//server/share");
      expect(normalizePath("src\\utils\\file.ts")).toBe("src/utils/file.ts");
    });

    test("should preserve forward slashes", () => {
      expect(normalizePath("C:/Users/name")).toBe("C:/Users/name");
      expect(normalizePath("/home/user")).toBe("/home/user");
    });

    test("should handle mixed separators", () => {
      expect(normalizePath("C:\\Users/name\\Documents")).toBe("C:/Users/name/Documents");
    });
  });

  describe("normalizeArgs", () => {
    test("should normalize string arguments", () => {
      expect(normalizeArgs("C:\\Users\\name")).toBe("C:/Users/name");
    });

    test("should not normalize non-path strings", () => {
      expect(normalizeArgs("http://example.com")).toBe("http://example.com");
      expect(normalizeArgs("simple-string")).toBe("simple-string");
    });

    test("should recursively normalize arrays", () => {
      const input = ["C:\\path\\1", "C:\\path\\2", "http://url"];
      const expected = ["C:/path/1", "C:/path/2", "http://url"];
      expect(normalizeArgs(input)).toEqual(expected);
    });

    test("should recursively normalize objects", () => {
      const input = {
        path: "C:\\Users\\name",
        url: "http://example.com",
        nested: {
          file: "src\\test.ts",
        },
      };
      const expected = {
        path: "C:/Users/name",
        url: "http://example.com",
        nested: {
          file: "src/test.ts",
        },
      };
      expect(normalizeArgs(input)).toEqual(expected);
    });

    test("should handle null and undefined", () => {
      expect(normalizeArgs(null)).toBe(null);
      expect(normalizeArgs(undefined)).toBe(undefined);
    });

    test("should handle complex nested structures", () => {
      const input = {
        files: ["C:\\a", "C:\\b"],
        config: {
          root: "D:\\root",
          exclude: ["**\\node_modules", "**\\.git"],
        },
      };
      const expected = {
        files: ["C:/a", "C:/b"],
        config: {
          root: "D:/root",
          exclude: ["**/node_modules", "**/.git"],
        },
      };
      expect(normalizeArgs(input)).toEqual(expected);
    });
  });
});
