import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import { ItemTag } from "contexts/Items/domain/item-tag.valueobject";
import { ItemTags } from "contexts/Items/domain/item-tags.valueobject";
import { ScheduledItem } from "contexts/Items/domain/scheduled-item.entity";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import { ItemID } from "../../../../src/contexts/Items/domain";

describe("ScheduledItem Tags", () => {
	const createTestItem = (tags: ItemTags = ItemTags.empty()) => {
		const startDate = new DateValueObject(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accountId = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(accountId, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];

		return ScheduledItem.infinite(
			startDate,
			new ItemName("Test Item"),
			fromSplits,
			toSplits,
			ItemOperation.income(accountId),
			CategoryID.generate(),
			SubCategoryID.generate(),
			frequency,
			tags
		);
	};

	describe("tags initialization", () => {
		it("should create item with empty tags by default", () => {
			const item = createTestItem();
			expect(item.tags?.isEmpty).toBe(true);
			expect(item.tags?.count).toBe(0);
		});

		it("should create item with provided tags", () => {
			const tags = ItemTags.fromStrings(["work", "important"]);
			const item = createTestItem(tags);
			expect(item.tags?.count).toBe(2);
			expect(item.tags?.has(new ItemTag("work"))).toBe(true);
			expect(item.tags?.has(new ItemTag("important"))).toBe(true);
		});
	});

	describe("tag management methods", () => {
		it("should add a tag to the item", () => {
			const item = createTestItem();
			const tag = new ItemTag("work");

			item.addTag(tag);

			expect(item.tags?.has(tag)).toBe(true);
			expect(item.tags?.count).toBe(1);
		});

		it("should remove a tag from the item", () => {
			const tags = ItemTags.fromStrings(["work", "personal"]);
			const item = createTestItem(tags);
			const tagToRemove = new ItemTag("work");

			item.removeTag(tagToRemove);

			expect(item.tags?.has(tagToRemove)).toBe(false);
			expect(item.tags?.has(new ItemTag("personal"))).toBe(true);
			expect(item.tags?.count).toBe(1);
		});

		it("should check if item has a specific tag", () => {
			const tags = ItemTags.fromStrings(["work", "important"]);
			const item = createTestItem(tags);

			expect(item.hasTag(new ItemTag("work"))).toBe(true);
			expect(item.hasTag(new ItemTag("important"))).toBe(true);
			expect(item.hasTag(new ItemTag("nonexistent"))).toBe(false);
		});

		it("should set all tags for the item", () => {
			const item = createTestItem();
			const newTags = ItemTags.fromStrings(["new", "tags"]);

			item.setTags(newTags);

			expect(item.tags?.count).toBe(2);
			expect(item.tags?.has(new ItemTag("new"))).toBe(true);
			expect(item.tags?.has(new ItemTag("tags"))).toBe(true);
		});

		it("should clear all tags from the item", () => {
			const tags = ItemTags.fromStrings(["work", "personal"]);
			const item = createTestItem(tags);

			item.clearTags();

			expect(item.tags?.isEmpty).toBe(true);
			expect(item.tags?.count).toBe(0);
		});
	});

	describe("serialization and deserialization", () => {
		it("should serialize tags correctly", () => {
			const tags = ItemTags.fromStrings(["work", "important", "urgent"]);
			const item = createTestItem(tags);

			const primitives = item.toPrimitives();

			expect(primitives.tags).toEqual({
				"0": "work",
				"1": "important",
				"2": "urgent",
			});
		});

		it("should deserialize tags correctly", () => {
			const tagsRecord = {
				"0": "work",
				"1": "important",
				"2": "urgent",
			};

			const primitives = {
				id: ItemID.generate().value,
				name: "Test Item",
				fromSplits: [],
				toSplits: [],
				operation: {
					type: "income" as const,
					account: AccountID.generate().value,
					toAccount: undefined,
				},
				category: CategoryID.generate().value,
				subCategory: SubCategoryID.generate().value,
				brand: "",
				store: "",
				recurrence: {
					startDate: new Date(2024, 0, 1),
					recurrences: [],
					frequency: undefined,
					untilDate: undefined,
				},
				updatedAt: new Date().toISOString(),
				tags: tagsRecord,
			};

			const item = ScheduledItem.fromPrimitives(primitives);

			expect(item.tags?.count).toBe(3);
			expect(item.tags?.has(new ItemTag("work"))).toBe(true);
			expect(item.tags?.has(new ItemTag("important"))).toBe(true);
			expect(item.tags?.has(new ItemTag("urgent"))).toBe(true);
		});

		it("should handle empty tags in serialization", () => {
			const item = createTestItem();

			const primitives = item.toPrimitives();

			expect(primitives.tags).toEqual({});
		});

		it("should handle empty tags in deserialization", () => {
			const primitives = {
				id: ItemID.generate().value,
				name: "Test Item",
				fromSplits: [],
				toSplits: [],
				operation: {
					type: "income" as const,
					account: AccountID.generate().value,
					toAccount: undefined,
				},
				category: CategoryID.generate().value,
				subCategory: SubCategoryID.generate().value,
				brand: "",
				store: "",
				recurrence: {
					startDate: new Date(2024, 0, 1),
					recurrences: [],
					frequency: undefined,
					untilDate: undefined,
				},
				updatedAt: new Date().toISOString(),
				tags: {},
			};

			const item = ScheduledItem.fromPrimitives(primitives);

			expect(item.tags?.isEmpty).toBe(true);
		});
	});

	describe("copy functionality", () => {
		it("should copy item with tags", () => {
			const tags = ItemTags.fromStrings(["work", "important"]);
			const item = createTestItem(tags);

			const copiedItem = item.copy();

			expect(copiedItem.tags?.count).toBe(2);
			expect(copiedItem.tags?.has(new ItemTag("work"))).toBe(true);
			expect(copiedItem.tags?.has(new ItemTag("important"))).toBe(true);
		});

		it("should have independent tags after copy", () => {
			const tags = ItemTags.fromStrings(["work"]);
			const item = createTestItem(tags);
			const copiedItem = item.copy();

			item.addTag(new ItemTag("new"));

			expect(item.tags?.count).toBe(2);
			expect(copiedItem.tags?.count).toBe(1);
		});
	});

	describe("case sensitivity", () => {
		it("should handle case-insensitive tag operations", () => {
			const item = createTestItem();

			item.addTag(new ItemTag("Work"));
			expect(item.hasTag(new ItemTag("work"))).toBe(true);
			expect(item.hasTag(new ItemTag("WORK"))).toBe(true);

			item.removeTag(new ItemTag("work"));
			expect(item.tags?.isEmpty).toBe(true);
		});
	});
});
