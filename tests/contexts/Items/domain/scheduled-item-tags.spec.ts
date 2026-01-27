import { StringValueObject } from "@juandardilag/value-objects";
import { Category, CategoryName } from "contexts/Categories/domain";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import { Subcategory, SubcategoryName } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	ItemRecurrenceFrequency,
	ItemTag,
	ItemTags,
	RecurrencePattern,
	RecurrenceType,
	ScheduledTransaction,
	ScheduledTransactionDate,
	ScheduledTransactionPrimitives,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

const category = Category.create(new CategoryName("Test Category"));
const subCategory = Subcategory.create(
	Nanoid.generate(),
	new SubcategoryName("Test Subcategory"),
);

describe("ScheduledTransaction Tags", () => {
	const createTestItem = (tags: ItemTags = ItemTags.empty()) => {
		const startDate = new ScheduledTransactionDate(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accounts = buildTestAccounts(1);
		const fromSplits = [
			new AccountSplit(accounts[0].nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = [];

		const scheduledTransaction = ScheduledTransaction.create(
			new StringValueObject("Test Item"),
			RecurrencePattern.infinite(startDate, frequency),
			fromSplits,
			toSplits,
			ItemOperation.income(),
			category.nanoid,
			subCategory.nanoid,
		);

		scheduledTransaction.updateTags(tags);

		return scheduledTransaction;
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
				category: category.id,
				subcategory: subCategory.id,
				store: "",
				recurrencePattern: {
					type: RecurrenceType.ONE_TIME,
					startDate: new Date(2024, 0, 1),
					frequency: undefined,
				},
				updatedAt: new Date().toISOString(),
				tags: tags,
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
				category: category.id,
				subcategory: subCategory.id,
				store: "",
				recurrencePattern: {
					type: RecurrenceType.ONE_TIME,
					startDate: new Date(2024, 0, 1),
				},
				updatedAt: new Date().toISOString(),
				tags: [],
			};

			const item = ScheduledTransaction.fromPrimitives(primitives);

			expect(item.tags?.isEmpty).toBe(true);
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
