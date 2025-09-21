import { ItemTag } from "contexts/Items/domain/item-tag.valueobject";
import { ItemTags } from "contexts/Items/domain/item-tags.valueobject";
import { describe, expect, it } from "vitest";

describe("ItemTags", () => {
	describe("constructor and validation", () => {
		it("should create empty tags collection", () => {
			const tags = ItemTags.empty();
			expect(tags.count).toBe(0);
			expect(tags.isEmpty).toBe(true);
		});

		it("should create tags from string array", () => {
			const tagStrings = ["work", "important", "urgent"];
			const tags = ItemTags.fromStrings(tagStrings);
			expect(tags.count).toBe(3);
			expect(tags.toArray()).toEqual(tagStrings);
		});

		it("should create tags from primitives", () => {
			const tagStrings = ["personal", "finance"];
			const tags = ItemTags.fromPrimitives(tagStrings);
			expect(tags.count).toBe(2);
			expect(tags.toArray()).toEqual(tagStrings);
		});

		it("should handle empty primitives", () => {
			const tags = ItemTags.fromPrimitives([]);
			expect(tags.count).toBe(0);
			expect(tags.isEmpty).toBe(true);
		});

		it("should handle undefined primitives", () => {
			const tags = ItemTags.fromPrimitives(undefined as never);
			expect(tags.count).toBe(0);
			expect(tags.isEmpty).toBe(true);
		});

		it("should throw error for non-array input", () => {
			expect(() => new ItemTags("invalid" as never)).toThrow(TypeError);
		});

		it("should throw error for non-ItemTag elements", () => {
			expect(() => new ItemTags(["invalid"] as never)).toThrow(TypeError);
		});

		it("should throw error for duplicate tags (case-insensitive)", () => {
			const tag1 = new ItemTag("Work");
			const tag2 = new ItemTag("work");
			expect(() => new ItemTags([tag1, tag2])).toThrowError(
				/does not allow the value/i
			);
		});
	});

	describe("tag management", () => {
		it("should add a new tag", () => {
			const tags = ItemTags.empty();
			const newTag = new ItemTag("new-tag");
			const updatedTags = tags.add(newTag);

			expect(updatedTags.count).toBe(1);
			expect(updatedTags.has(newTag)).toBe(true);
			expect(updatedTags.toArray()).toEqual(["new-tag"]);
		});

		it("should not add duplicate tags", () => {
			const tag1 = new ItemTag("work");
			const tag2 = new ItemTag("Work");
			const tags = new ItemTags([tag1]);

			expect(() => tags.add(tag2)).toThrowError(
				/does not allow the value/i
			);
		});

		it("should remove a tag", () => {
			const tag1 = new ItemTag("work");
			const tag2 = new ItemTag("personal");
			const tags = new ItemTags([tag1, tag2]);

			const updatedTags = tags.remove(tag1);
			expect(updatedTags.count).toBe(1);
			expect(updatedTags.has(tag1)).toBe(false);
			expect(updatedTags.has(tag2)).toBe(true);
			expect(updatedTags.toArray()).toEqual(["personal"]);
		});

		it("should remove tag case-insensitively", () => {
			const tag1 = new ItemTag("Work");
			const tag2 = new ItemTag("personal");
			const tags = new ItemTags([tag1, tag2]);

			const tagToRemove = new ItemTag("work");
			const updatedTags = tags.remove(tagToRemove);
			expect(updatedTags.count).toBe(1);
			expect(updatedTags.has(tag1)).toBe(false);
			expect(updatedTags.has(tag2)).toBe(true);
		});

		it("should check if tag exists", () => {
			const tag1 = new ItemTag("work");
			const tag2 = new ItemTag("personal");
			const tags = new ItemTags([tag1, tag2]);

			expect(tags.has(tag1)).toBe(true);
			expect(tags.has(tag2)).toBe(true);
			expect(tags.has(new ItemTag("nonexistent"))).toBe(false);
		});

		it("should check tag existence case-insensitively", () => {
			const tag = new ItemTag("Work");
			const tags = new ItemTags([tag]);

			expect(tags.has(new ItemTag("work"))).toBe(true);
			expect(tags.has(new ItemTag("WORK"))).toBe(true);
		});
	});

	describe("utility methods", () => {
		it("should convert to string", () => {
			const tag1 = new ItemTag("work");
			const tag2 = new ItemTag("important");
			const tags = new ItemTags([tag1, tag2]);

			expect(tags.toString()).toBe("work, important");
		});

		it("should convert to primitives", () => {
			const tagStrings = ["work", "important", "urgent"];
			const tags = ItemTags.fromStrings(tagStrings);

			expect(tags.toPrimitives()).toEqual(tagStrings);
		});

		it("should return correct count", () => {
			const tags = ItemTags.fromStrings(["a", "b", "c"]);
			expect(tags.count).toBe(3);
		});

		it("should check if empty", () => {
			const emptyTags = ItemTags.empty();
			const nonEmptyTags = ItemTags.fromStrings(["work"]);

			expect(emptyTags.isEmpty).toBe(true);
			expect(nonEmptyTags.isEmpty).toBe(false);
		});
	});

	describe("immutability", () => {
		it("should not modify original when adding tag", () => {
			const originalTags = ItemTags.empty();
			const newTag = new ItemTag("work");
			const updatedTags = originalTags.add(newTag);

			expect(originalTags.count).toBe(0);
			expect(updatedTags.count).toBe(1);
		});

		it("should not modify original when removing tag", () => {
			const tag1 = new ItemTag("work");
			const tag2 = new ItemTag("personal");
			const originalTags = new ItemTags([tag1, tag2]);
			const updatedTags = originalTags.remove(tag1);

			expect(originalTags.count).toBe(2);
			expect(updatedTags.count).toBe(1);
		});
	});
});
