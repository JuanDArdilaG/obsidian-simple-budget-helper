import { NumberValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemID,
	ItemPrice,
	ItemRecurrenceInfo,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { IItemsService } from "contexts/Items/domain/items-service.interface";
import { Criteria } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";

export class ItemsServiceMock implements IItemsService {
	constructor(public items: ScheduledItem[]) {}

	async getByCategory(category: CategoryID): Promise<ScheduledItem[]> {
		return this.items.filter((item) => item.category.equalTo(category));
	}

	async getBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledItem[]> {
		return this.items.filter((item) =>
			item.subCategory.equalTo(subCategory)
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
		oldCategory: CategoryID,
		newCategory: CategoryID
	): Promise<void> {
		const items = await this.getByCategory(oldCategory);
		for (const item of items) {
			item.updateCategory(newCategory);
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory);
		for (const item of items) {
			item.updateSubCategory(newSubCategory);
		}
	}

	async reassignItemsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		const items = await this.getByCategory(oldCategory);
		for (const item of items) {
			item.updateCategory(newCategory);
			item.updateSubCategory(newSubCategory);
		}
	}

	async modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo,
		fromSplits?: PaymentSplit[],
		toSplits?: PaymentSplit[]
	): Promise<void> {
		const item = await this.getByID(id);
		item.modifyRecurrence(n.value, newRecurrence);
		if (fromSplits) {
			item.setFromSplits(fromSplits);
		}
		if (toSplits) {
			item.setToSplits(toSplits);
		}
	}

	async deleteRecurrence(id: ItemID, n: NumberValueObject): Promise<void> {
		const item = await this.getByID(id);
		item.deleteRecurrence(n.value);
	}

	async completeRecurrence(id: ItemID, n: NumberValueObject): Promise<void> {
		const item = await this.getByID(id);
		item.completeRecurrence(n.value);
	}

	async recordFutureRecurrence(
		id: ItemID,
		n: NumberValueObject
	): Promise<void> {
		const item = await this.getByID(id);
		item.recordFutureRecurrence(n.value);
	}

	async getAllRecurrencesWithStates(
		id: ItemID
	): Promise<{ recurrence: ItemRecurrenceInfo; n: NumberValueObject }[]> {
		const item = await this.getByID(id);
		return item.getAllRecurrencesWithStates();
	}

	async getRecurrenceStats(id: ItemID): Promise<{
		active: number;
		completed: number;
		pending: number;
		deleted: number;
		total: number;
	}> {
		const item = await this.getByID(id);
		return item.getRecurrenceStats();
	}

	async getPricePerMonth(itemID: ItemID): Promise<ItemPrice> {
		const item = await this.getByID(itemID);
		return item.realPrice.times(item.recurrence.perMonthRelation);
	}

	async exists(id: ItemID): Promise<boolean> {
		return this.items.some((item) => item.id.equalTo(id));
	}

	async create(item: ScheduledItem): Promise<void> {
		this.items.push(item);
	}

	async getByID(id: ItemID): Promise<ScheduledItem> {
		const item = this.items.find((i) => i.id.equalTo(id));
		if (!item) throw new Error("item not found on get");
		return Promise.resolve(item);
	}

	async getByCriteria(
		criteria: Criteria<ScheduledItemPrimitives>
	): Promise<ScheduledItem[]> {
		throw new Error("Method not implemented.");
	}

	async getAll(): Promise<ScheduledItem[]> {
		return Promise.resolve(this.items);
	}

	async update(item: ScheduledItem): Promise<void> {
		const index = this.items.findIndex((i) => i.id.equalTo(item.id));
		if (index !== -1) {
			this.items[index] = item;
		}
	}

	async delete(id: ItemID): Promise<void> {
		const index = this.items.findIndex((i) => i.id.equalTo(id));
		if (index !== -1) {
			this.items.splice(index, 1);
		}
	}
}
