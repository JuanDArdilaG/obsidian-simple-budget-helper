import { CategoryID } from "contexts/Categories/domain";
import { IRepository, Nanoid } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "./recurrence-modification.entity";
import {
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "./scheduled-transaction.entity";

export interface IScheduledTransactionsRepository
	extends IRepository<
		Nanoid,
		ScheduledTransaction,
		ScheduledTransactionPrimitives
	> {
	findByCategory(category: CategoryID): Promise<ScheduledTransaction[]>;
	findBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledTransaction[]>;
}

export interface IRecurrenceModificationsRepository
	extends IRepository<
		Nanoid,
		RecurrenceModification,
		RecurrenceModificationPrimitives
	> {
	findByScheduledItemId(
		scheduledItemId: Nanoid
	): Promise<RecurrenceModification[]>;
	findByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
	): Promise<RecurrenceModification | null>;
	deleteByScheduledItemId(scheduledItemId: Nanoid): Promise<void>;
	countByScheduledItemId(scheduledItemId: Nanoid): Promise<number>;
}
