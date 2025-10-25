import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { format } from "./format.js";

describe("format()", () => {
  describe("primitive values", () => {
    it("should return primitive values unchanged", () => {
      assert.equal(format(42), 42);
      assert.equal(format(true), true);
      assert.equal(format(false), false);
      assert.equal(format(null), null);
      assert.equal(format(undefined), undefined);
    });

    it("should return simple strings without newlines unchanged", () => {
      assert.equal(format("hello"), "hello");
      assert.equal(format(""), "");
      assert.equal(format("test string"), "test string");
    });

    it("should return numbers unchanged", () => {
      assert.equal(format(0), 0);
      assert.equal(format(-1), -1);
      assert.equal(format(3.14), 3.14);
      assert.equal(format(NaN), NaN);
      assert.equal(format(Infinity), Infinity);
    });
  });

  describe("strings with newlines", () => {
    it("should split strings containing newlines into arrays", () => {
      const input = "line1\nline2\nline3";
      const expected = ["line1", "line2", "line3"];
      assert.deepEqual(format(input), expected);
    });

    it("should handle strings with single newline", () => {
      const input = "hello\nworld";
      const expected = ["hello", "world"];
      assert.deepEqual(format(input), expected);
    });

    it("should handle strings with leading/trailing newlines", () => {
      const input = "\nhello\n";
      const expected = ["", "hello", ""];
      assert.deepEqual(format(input), expected);
    });

    it("should handle strings with multiple consecutive newlines", () => {
      const input = "a\n\n\nb";
      const expected = ["a", "", "", "b"];
      assert.deepEqual(format(input), expected);
    });

    it("should handle strings with only newlines", () => {
      const input = "\n\n";
      const expected = ["", "", ""];
      assert.deepEqual(format(input), expected);
    });
  });

  describe("arrays", () => {
    it("should format each element in an array", () => {
      const input = [1, 2, 3];
      const expected = [1, 2, 3];
      assert.deepEqual(format(input), expected);
    });

    it("should recursively format nested arrays", () => {
      const input = [1, [2, 3], [4, [5, 6]]];
      const expected = [1, [2, 3], [4, [5, 6]]];
      assert.deepEqual(format(input), expected);
    });

    it("should split strings with newlines in arrays", () => {
      const input = ["hello\nworld", "test"];
      const expected = [["hello", "world"], "test"];
      assert.deepEqual(format(input), expected);
    });

    it("should handle empty arrays", () => {
      const input = [];
      const expected = [];
      assert.deepEqual(format(input), expected);
    });

    it("should format mixed type arrays", () => {
      const input = [1, "test\nline", true, null, { key: "value" }];
      const expected = [1, ["test", "line"], true, null, { key: "value" }];
      assert.deepEqual(format(input), expected);
    });
  });

  describe("objects", () => {
    it("should format simple objects", () => {
      const input = { a: 1, b: 2 };
      const expected = { a: 1, b: 2 };
      assert.deepEqual(format(input), expected);
    });

    it("should recursively format nested objects", () => {
      const input = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };
      const expected = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };
      assert.deepEqual(format(input), expected);
    });

    it("should split strings with newlines in object values", () => {
      const input = {
        simple: "test",
        multiline: "line1\nline2\nline3",
      };
      const expected = {
        simple: "test",
        multiline: ["line1", "line2", "line3"],
      };
      assert.deepEqual(format(input), expected);
    });

    it("should handle empty objects", () => {
      const input = {};
      const expected = {};
      assert.deepEqual(format(input), expected);
    });

    it("should format objects with array values", () => {
      const input = {
        arr: [1, 2, "test\nline"],
      };
      const expected = {
        arr: [1, 2, ["test", "line"]],
      };
      assert.deepEqual(format(input), expected);
    });

    it("should format objects with nested objects and arrays", () => {
      const input = {
        obj: {
          nested: "value\nwith\nnewlines",
        },
        arr: ["simple", "multi\nline"],
      };
      const expected = {
        obj: {
          nested: ["value", "with", "newlines"],
        },
        arr: ["simple", ["multi", "line"]],
      };
      assert.deepEqual(format(input), expected);
    });
  });

  describe("complex nested structures", () => {
    it("should handle deeply nested arrays and objects", () => {
      const input = {
        users: [
          { name: "John\nDoe", age: 30 },
          { name: "Jane Smith", age: 25 },
        ],
        meta: {
          description: "Test\ndata\nset",
          version: 1,
        },
      };
      const expected = {
        users: [
          { name: ["John", "Doe"], age: 30 },
          { name: "Jane Smith", age: 25 },
        ],
        meta: {
          description: ["Test", "data", "set"],
          version: 1,
        },
      };
      assert.deepEqual(format(input), expected);
    });

    it("should handle arrays of objects with multiline strings", () => {
      const input = [
        { msg: "line1\nline2" },
        { msg: "single" },
        { msg: "more\nlines\nhere" },
      ];
      const expected = [
        { msg: ["line1", "line2"] },
        { msg: "single" },
        { msg: ["more", "lines", "here"] },
      ];
      assert.deepEqual(format(input), expected);
    });
  });

  describe("edge cases and special objects", () => {
    it("should not treat Date objects as plain objects", () => {
      const date = new Date("2025-01-01");
      const input = { date };
      const result = format(input);

      // Date should remain as Date object, not be treated as plain object
      assert.ok(result.date instanceof Date);
      assert.equal(result.date.getTime(), date.getTime());
    });

    it("should not treat RegExp as plain objects", () => {
      const regex = /test/g;
      const input = { regex };
      const result = format(input);

      // RegExp should remain as RegExp, not be treated as plain object
      assert.ok(result.regex instanceof RegExp);
      assert.equal(result.regex.toString(), regex.toString());
    });

    it("should handle null values in objects", () => {
      const input = { key: null };
      const expected = { key: null };
      assert.deepEqual(format(input), expected);
    });

    it("should handle undefined values in objects", () => {
      const input = { key: undefined };
      const expected = { key: undefined };
      assert.deepEqual(format(input), expected);
    });

    it("should handle objects created with Object.create(null)", () => {
      const input = Object.create(null);
      input.key = "value\nwith\nnewline";

      const result = format(input);
      assert.deepEqual(result.key, ["value", "with", "newline"]);
    });

    it("should handle mixed arrays with null and undefined", () => {
      const input = [null, undefined, "test\nline", null];
      const expected = [null, undefined, ["test", "line"], null];
      assert.deepEqual(format(input), expected);
    });
  });

  describe("isObject() helper coverage", () => {
    it("should correctly identify plain objects vs other object types", () => {
      // These should be treated as plain objects (recursively formatted)
      const plainObj = { key: "line1\nline2" };
      const result1 = format(plainObj);
      assert.deepEqual(result1.key, ["line1", "line2"]);

      // These should NOT be treated as plain objects (returned as-is)
      const date = new Date();
      const result2 = format({ date });
      assert.ok(result2.date instanceof Date);

      const regex = /test/;
      const result3 = format({ regex });
      assert.ok(result3.regex instanceof RegExp);

      const arr = [1, 2, 3];
      const result4 = format({ arr });
      assert.ok(Array.isArray(result4.arr));
    });
  });
});
