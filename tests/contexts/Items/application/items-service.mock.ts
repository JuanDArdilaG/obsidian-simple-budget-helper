import { NumberValueObject } from "@juandardilag/value-objects";
import { Category } from "contexts/Categories/domain";
import { Criteria, Nanoid } from "contexts/Shared/domain";
import { Subcategory } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import {
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../../../src/contexts/ScheduledTransactions/domain";

export class ScheduledTransactionsServiceMock implements IScheduledTransactionsService {
	constructor(public items: ScheduledTransaction[]) {}

	getOccurrence(
		id: Nanoid,
		occurrenceIndex: number,
	): Promise<ItemRecurrenceInfo | null> {
		throw new Error("Method not implemented.");
	}
	getMonthlyPriceEstimate(id: Nanoid): Promise<NumberValueObject> {
		throw new Error("Method not implemented.");
	}

	async getByCategory(category: Nanoid): Promise<ScheduledTransaction[]> {
		return this.items.filter(
			(item) => item.category.value === category.value,
		);
	}

	async getBySubCategory(
		subCategory: Nanoid,
	): Promise<ScheduledTransaction[]> {
		return this.items.filter(
			(item) => item.subcategory.value === subCategory.value,
		);
	}

	async hasItemsByCategory(category: Nanoid): Promise<boolean> {
		const items = await this.getByCategory(category);
		return items.length > 0;
	}

	async hasItemsBySubCategory(subCategory: Nanoid): Promise<boolean> {
		const items = await this.getBySubCategory(subCategory);
		return items.length > 0;
	}

	async reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.nanoid);
		for (const item of items) {
			item.category = newCategory.nanoid;
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: Subcategory,
		newSubCategory: Subcategory,
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory.nanoid);
		for (const item of items) {
			item.subcategory = newSubCategory.nanoid;
		}
	}

	async reassignItemsCategoryAndSubcategory(
		oldCategoryId: Nanoid,
		oldSubcategoryId: Nanoid | undefined,
		newCategory: Category,
		newSubCategory: Subcategory,
	): Promise<void> {
		const items = oldSubcategoryId
			? await this.getBySubCategory(oldSubcategoryId)
			: await this.getByCategory(oldCategoryId);
		for (const item of items) {
			item.category = newCategory.nanoid;
			item.subcategory = newSubCategory.nanoid;
		}
	}

	async modifyRecurrence(
		id: Nanoid,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo,
		fromSplits?: AccountSplit[],
		toSplits?: AccountSplit[],
	): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async deleteRecurrence(id: Nanoid, n: NumberValueObject): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async completeRecurrence(id: Nanoid, n: NumberValueObject): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async exists(id: string): Promise<boolean> {
		return this.items.some((item) => item.id === id);
	}

	async create(item: ScheduledTransaction): Promise<void> {
		this.items.push(item);
	}

	async getByID(id: string): Promise<ScheduledTransaction> {
		const item = this.items.find((i) => i.id === id);
		if (!item) throw new Error("item not found on get");
		return item;
	}

	async getByCriteria(
		criteria: Criteria<ScheduledTransactionPrimitives>,
	): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}

	async getAll(): Promise<ScheduledTransaction[]> {
		return this.items;
	}

	async update(item: ScheduledTransaction): Promise<void> {
		const index = this.items.findIndex((i) => i.id === item.id);
		if (index !== -1) {
			this.items[index] = item;
		}
	}

	async delete(id: string): Promise<void> {
		const index = this.items.findIndex((i) => i.id === id);
		if (index !== -1) {
			this.items.splice(index, 1);
		}
	}
}
