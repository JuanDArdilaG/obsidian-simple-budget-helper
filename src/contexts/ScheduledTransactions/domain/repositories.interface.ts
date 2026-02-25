import { IRepository, Nanoid } from "contexts/Shared/domain";
import {
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "./recurrence-modification.entity";
import {
	ScheduledTransaction,
	ScheduledTransactionPrimitives,
} from "./scheduled-transaction.entity";

export interface IScheduledTransactionsRepository extends IRepository<
	string,
	ScheduledTransaction,
	ScheduledTransactionPrimitives
> {
	findByCategory(category: Nanoid): Promise<ScheduledTransaction[]>;
	findBySubCategory(subCategory: Nanoid): Promise<ScheduledTransaction[]>;
}

export interface IRecurrenceModificationsRepository extends IRepository<
	string,
	RecurrenceModification,
	RecurrenceModificationPrimitives
> {
	findByScheduledItemId(
		scheduledItemId: Nanoid,
	): Promise<RecurrenceModification[]>;
	findByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<RecurrenceModification | null>;
	deleteByScheduledItemId(scheduledItemId: Nanoid): Promise<void>;
	countByScheduledItemId(scheduledItemId: Nanoid): Promise<number>;
}
