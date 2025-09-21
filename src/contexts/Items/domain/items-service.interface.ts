import { NumberValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import { IService } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-modification.valueobject";
import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "./scheduled-item.entity";

export interface IItemsService
	extends IService<ItemID, ScheduledItem, ScheduledItemPrimitives> {
	getByCategory(category: CategoryID): Promise<ScheduledItem[]>;
	getBySubCategory(subCategory: SubCategoryID): Promise<ScheduledItem[]>;
	hasItemsByCategory(category: CategoryID): Promise<boolean>;
	hasItemsBySubCategory(subCategory: SubCategoryID): Promise<boolean>;
	reassignItemsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID
	): Promise<void>;
	reassignItemsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID
	): Promise<void>;
	reassignItemsCategoryAndSubcategory(
		oldCategory: CategoryID,
		newCategory: CategoryID,
		newSubCategory: SubCategoryID
	): Promise<void>;
	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo,
		fromSplits?: PaymentSplit[],
		toSplits?: PaymentSplit[]
	): Promise<void>;
	deleteRecurrence(id: ItemID, n: NumberValueObject): Promise<void>;
	completeRecurrence(id: ItemID, n: NumberValueObject): Promise<void>;
	recordFutureRecurrence(id: ItemID, n: NumberValueObject): Promise<void>;
	getAllRecurrencesWithStates(
		id: ItemID
	): Promise<{ recurrence: ItemRecurrenceInfo; n: NumberValueObject }[]>;
	getRecurrenceStats(id: ItemID): Promise<{
		active: number;
		completed: number;
		pending: number;
		deleted: number;
		total: number;
	}>;

	getPricePerMonth(itemID: ItemID): Promise<ItemPrice>;
}
