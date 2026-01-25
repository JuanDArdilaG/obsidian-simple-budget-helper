import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Category } from "contexts/Categories/domain";
import { IService, Nanoid } from "contexts/Shared/domain";
import { Subcategory } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-info.valueobject";
import {
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "./recurrence-modification.entity";
import {
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "./scheduled-transaction.entity";

export interface IScheduledTransactionsService extends IService<
	string,
	ScheduledTransaction,
	ScheduledTransactionPrimitives
> {
	// Item management
	getByCategory(category: Nanoid): Promise<ScheduledTransaction[]>;
	getBySubCategory(subCategory: Nanoid): Promise<ScheduledTransaction[]>;
	hasItemsByCategory(category: Nanoid): Promise<boolean>;
	hasItemsBySubCategory(subCategory: Nanoid): Promise<boolean>;
	reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category,
	): Promise<void>;
	reassignItemsSubCategory(
		oldSubCategory: Subcategory,
		newSubCategory: Subcategory,
	): Promise<void>;
	reassignItemsCategoryAndSubcategory(
		oldCategoryId: Nanoid,
		oldSubcategoryId: Nanoid | undefined,
		newCategory: Category,
		newSubCategory: Subcategory,
	): Promise<void>;

	getOccurrence(
		id: Nanoid,
		occurrenceIndex: number,
	): Promise<ItemRecurrenceInfo | null>;

	getMonthlyPriceEstimate(id: Nanoid): Promise<NumberValueObject>;
}

export interface IRecurrenceModificationsService extends IService<
	string,
	RecurrenceModification,
	RecurrenceModificationPrimitives
> {
	// Find modifications
	getByScheduledItemId(
		scheduledItemId: Nanoid,
	): Promise<RecurrenceModification[]>;
	getByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<RecurrenceModification | null>;

	// Modify occurrences
	modifyOccurrence(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
		modifications: {
			date?: DateValueObject;
			fromSplits?: AccountSplit[];
			toSplits?: AccountSplit[];
		},
	): Promise<RecurrenceModification>;

	// State management
	markOccurrenceAsCompleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<RecurrenceModification>;

	markOccurrenceAsDeleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<RecurrenceModification>;

	resetOccurrenceToPending(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<void>;

	// Bulk operations
	clearAllModifications(scheduledItemId: Nanoid): Promise<void>;
	deleteModificationsByScheduledItem(scheduledItemId: Nanoid): Promise<void>;

	// Statistics
	countModificationsByScheduledItem(scheduledItemId: Nanoid): Promise<number>;
	getStatsByScheduledItem(scheduledItemId: Nanoid): Promise<{
		total: number;
		pending: number;
		completed: number;
		skipped: number;
		deleted: number;
	}>;
}
