import { NumberValueObject } from "@juandardilag/value-objects";
import { Category, CategoryID } from "contexts/Categories/domain";
import { Criteria, Nanoid } from "contexts/Shared/domain";
import { SubCategory, SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import {
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "../../../../src/contexts/ScheduledTransactions/domain";

export class ScheduledTransactionsServiceMock
	implements IScheduledTransactionsService
{
	constructor(public items: ScheduledTransaction[]) {}

	getOccurrence(
		id: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<ItemRecurrenceInfo | null> {
		throw new Error("Method not implemented.");
	}
	getMonthlyPriceEstimate(id: Nanoid): Promise<NumberValueObject> {
		throw new Error("Method not implemented.");
	}

	async getByCategory(category: CategoryID): Promise<ScheduledTransaction[]> {
		return this.items.filter((item) =>
			item.category.category.id.equalTo(category)
		);
	}

	async getBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledTransaction[]> {
		return this.items.filter((item) =>
			item.category.subCategory.id.equalTo(subCategory)
		);
	}

	async hasItemsByCategory(category: CategoryID): Promise<boolean> {
		const items = await this.getByCategory(category);
		return items.length > 0;
	}

	async hasItemsBySubCategory(subCategory: SubCategoryID): Promise<boolean> {
		const items = await this.getBySubCategory(subCategory);
		return items.length > 0;
	}

	async reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.id);
		for (const item of items) {
			item.category.category = newCategory;
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: SubCategory,
		newSubCategory: SubCategory
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory.id);
		for (const item of items) {
			item.category.subCategory = newSubCategory;
		}
	}

	async reassignItemsCategoryAndSubcategory(
		oldCategory: Category,
		newCategory: Category,
		newSubCategory: SubCategory
	): Promise<void> {
		const items = await this.getByCategory(oldCategory.id);
		for (const item of items) {
			item.category.category = newCategory;
			item.category.subCategory = newSubCategory;
		}
	}

	async modifyRecurrence(
		id: Nanoid,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo,
		fromSplits?: PaymentSplit[],
		toSplits?: PaymentSplit[]
	): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async deleteRecurrence(id: Nanoid, n: NumberValueObject): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async completeRecurrence(id: Nanoid, n: NumberValueObject): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async exists(id: Nanoid): Promise<boolean> {
		return this.items.some((item) => item.id.equalTo(id));
	}

	async create(item: ScheduledTransaction): Promise<void> {
		this.items.push(item);
	}

	async getByID(id: Nanoid): Promise<ScheduledTransaction> {
		const item = this.items.find((i) => i.id.equalTo(id));
		if (!item) throw new Error("item not found on get");
		return Promise.resolve(item);
	}

	async getByCriteria(
		criteria: Criteria<ScheduledTransactionPrimitives>
	): Promise<ScheduledTransaction[]> {
		throw new Error("Method not implemented.");
	}

	async getAll(): Promise<ScheduledTransaction[]> {
		return Promise.resolve(this.items);
	}

	async update(item: ScheduledTransaction): Promise<void> {
		const index = this.items.findIndex((i) => i.id.equalTo(item.id));
		if (index !== -1) {
			this.items[index] = item;
		}
	}

	async delete(id: Nanoid): Promise<void> {
		const index = this.items.findIndex((i) => i.id.equalTo(id));
		if (index !== -1) {
			this.items.splice(index, 1);
		}
	}
}
