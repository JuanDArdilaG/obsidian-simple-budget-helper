import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Category, CategoryID } from "contexts/Categories/domain";
import { IService, Nanoid } from "contexts/Shared/domain";
import { SubCategory, SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-info.valueobject";
import {
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "./recurrence-modification.entity";
import {
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "./scheduled-transaction.entity";

export interface IScheduledTransactionsService
	extends IService<
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	> {
	// Item management
	getByCategory(category: CategoryID): Promise<ScheduledTransaction[]>;
	getBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledTransaction[]>;
	hasItemsByCategory(category: CategoryID): Promise<boolean>;
	hasItemsBySubCategory(subCategory: SubCategoryID): Promise<boolean>;
	reassignItemsCategory(
		oldCategory: Category,
		newCategory: Category
	): Promise<void>;
	reassignItemsSubCategory(
		oldSubCategory: SubCategory,
		newSubCategory: SubCategory
	): Promise<void>;
	reassignItemsCategoryAndSubcategory(
		oldCategory: Category,
		newCategory: Category,
		newSubCategory: SubCategory
	): Promise<void>;

	getOccurrence(
		id: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<ItemRecurrenceInfo | null>;

	getMonthlyPriceEstimate(id: Nanoid): Promise<NumberValueObject>;
}

export interface IRecurrenceModificationsService
	extends IService<
		Nanoid,
		RecurrenceModification,
		RecurrenceModificationPrimitives
	> {
	// Find modifications
	getByScheduledItemId(
		scheduledItemId: Nanoid
	): Promise<RecurrenceModification[]>;
	getByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
	): Promise<RecurrenceModification | null>;

	// Modify occurrences
	modifyOccurrence(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject,
		modifications: {
			date?: DateValueObject;
			fromSplits?: PaymentSplit[];
			toSplits?: PaymentSplit[];
		}
	): Promise<RecurrenceModification>;

	// State management
	markOccurrenceAsCompleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<RecurrenceModification>;

	markOccurrenceAsDeleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<RecurrenceModification>;

	resetOccurrenceToPending(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
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
