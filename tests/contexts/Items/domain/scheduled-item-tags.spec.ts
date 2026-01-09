import { StringValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import {
	SubCategory,
	SubCategoryID,
	SubCategoryName,
} from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	ItemRecurrenceFrequency,
	ItemTag,
	ItemTags,
	RecurrenceType,
	ScheduledTransaction,
	ScheduledTransactionDate,
	ScheduledTransactionPrimitives,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";

describe("ScheduledTransaction Tags", () => {
	const createTestItem = (tags: ItemTags = ItemTags.empty()) => {
		const startDate = new ScheduledTransactionDate(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accountId = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(accountId, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];

		return ScheduledTransaction.createInfinite(
			new StringValueObject("Test Item"),
			startDate,
			frequency,
			fromSplits,
			toSplits,
			ItemOperation.income(),
			new TransactionCategory(
				Category.create(new CategoryName("Test")),
				SubCategory.create(
					CategoryID.generate(),
					new SubCategoryName("Test Subcategory")
				)
			),
			undefined,
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

			item.updateTags(newTags);

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

			expect(primitives.tags).toEqual(["work", "important", "urgent"]);
		});

		it("should deserialize tags correctly", () => {
			const tags = ["work", "important", "urgent"];

			const primitives: ScheduledTransactionPrimitives = {
				id: Nanoid.generate().value,
				name: "Test Item",
				fromSplits: [],
				toSplits: [],
				operation: {
					type: "income" as const,
				},
				category: {
					category: {
						id: CategoryID.generate().value,
						name: "Test",
						updatedAt: new Date().toISOString(),
					},
					subCategory: {
						id: SubCategoryID.generate().value,
						name: "Test Subcategory",
						category: CategoryID.generate().value,
						updatedAt: new Date().toISOString(),
					},
				},
				store: "",
				recurrencePattern: {
					type: RecurrenceType.ONE_TIME,
					startDate: new Date(2024, 0, 1),
					frequency: undefined,
				},
				updatedAt: new Date().toISOString(),
				tags: tags,
				nextOccurrenceIndex: 0,
			};

			const item = ScheduledTransaction.fromPrimitives(primitives);

			expect(item.tags?.count).toBe(3);
			expect(item.tags?.has(new ItemTag("work"))).toBe(true);
			expect(item.tags?.has(new ItemTag("important"))).toBe(true);
			expect(item.tags?.has(new ItemTag("urgent"))).toBe(true);
		});

		it("should handle empty tags in serialization", () => {
			const item = createTestItem();

			const primitives = item.toPrimitives();

			expect(primitives.tags).toEqual([]);
		});

		it("should handle empty tags in deserialization", () => {
			const primitives: ScheduledTransactionPrimitives = {
				id: Nanoid.generate().value,
				name: "Test Item",
				fromSplits: [],
				toSplits: [],
				operation: {
					type: "income" as const,
				},
				category: {
					category: {
						id: CategoryID.generate().value,
						name: "Test",
						updatedAt: new Date().toISOString(),
					},
					subCategory: {
						id: SubCategoryID.generate().value,
						name: "Test Subcategory",
						category: CategoryID.generate().value,
						updatedAt: new Date().toISOString(),
					},
				},
				store: "",
				recurrencePattern: {
					type: RecurrenceType.ONE_TIME,
					startDate: new Date(2024, 0, 1),
				},
				updatedAt: new Date().toISOString(),
				tags: [],
				nextOccurrenceIndex: 0,
			};

			const item = ScheduledTransaction.fromPrimitives(primitives);

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
