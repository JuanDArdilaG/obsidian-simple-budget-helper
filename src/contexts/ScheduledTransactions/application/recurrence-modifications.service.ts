import { NumberValueObject } from "@juandardilag/value-objects";
import { Service } from "contexts/Shared/application/service.abstract";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { Nanoid } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsRepository,
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	RecurrenceModification,
	RecurrenceModificationPrimitives,
	RecurrenceModificationState,
	ScheduledTransactionDate,
} from "../domain";

export class RecurrenceModificationsService
	extends Service<
		Nanoid,
		RecurrenceModification,
		RecurrenceModificationPrimitives
	>
	implements IRecurrenceModificationsService
{
	#logger = new Logger("RecurrenceModificationsService");
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
		private readonly _recurrenceModificationsRepository: IRecurrenceModificationsRepository
	) {
		super("RecurrenceModification", _recurrenceModificationsRepository);
	}

	async getByScheduledItemId(
		scheduledItemId: Nanoid
	): Promise<RecurrenceModification[]> {
		return await this._recurrenceModificationsRepository.findByScheduledItemId(
			scheduledItemId
		);
	}

	async getByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
	): Promise<RecurrenceModification | null> {
		return await this._recurrenceModificationsRepository.findByScheduledItemIdAndOccurrenceIndex(
			scheduledItemId,
			occurrenceIndex
		);
	}

	async modifyOccurrence(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject,
		modifications: {
			date?: ScheduledTransactionDate;
			fromSplits?: PaymentSplit[];
			toSplits?: PaymentSplit[];
		}
	): Promise<RecurrenceModification> {
		// Check if modification already exists
		const existingModification =
			await this.getByScheduledItemIdAndOccurrenceIndex(
				scheduledItemId,
				occurrenceIndex.value
			);

		this.#logger.debug("modifyOccurrence", {
			scheduledItemId,
			occurrenceIndex: occurrenceIndex.value,
			modifications,
			existingModification,
		});

		if (existingModification) {
			// Update existing modification
			if (modifications.date) {
				existingModification.updateDate(modifications.date);
			}
			if (modifications.fromSplits) {
				existingModification.updateFromSplits(modifications.fromSplits);
			}
			if (modifications.toSplits) {
				existingModification.updateToSplits(modifications.toSplits);
			}

			await this._recurrenceModificationsRepository.persist(
				existingModification
			);
			return existingModification;
		} else {
			// Create new modification
			const scheduledTransaction =
				await this._scheduledTransactionsRepository.findById(
					scheduledItemId
				);
			const modificationDate =
				scheduledTransaction?.getOccurrenceDate(occurrenceIndex);
			if (!modificationDate) {
				throw new Error(
					`Cannot modify occurrence at index ${occurrenceIndex} - error getting original date`
				);
			}
			const newModification = RecurrenceModification.create(
				scheduledItemId,
				occurrenceIndex,
				modificationDate,
				RecurrenceModificationState.PENDING,
				modifications.date,
				modifications.fromSplits,
				modifications.toSplits
			);

			await this._recurrenceModificationsRepository.persist(
				newModification
			);
			return newModification;
		}
	}

	async markOccurrenceAsCompleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<RecurrenceModification> {
		let modification = await this.getByScheduledItemIdAndOccurrenceIndex(
			scheduledItemId,
			occurrenceIndex.value
		);

		if (!modification) {
			const scheduledTransaction =
				await this._scheduledTransactionsRepository.findById(
					scheduledItemId
				);
			const modificationDate =
				scheduledTransaction?.getOccurrenceDate(occurrenceIndex);
			if (!modificationDate) {
				throw new Error(
					`Cannot mark occurrence at index ${occurrenceIndex} as completed - error getting original date`
				);
			}
			// Create new modification with completed state
			modification = RecurrenceModification.create(
				scheduledItemId,
				occurrenceIndex,
				modificationDate,
				RecurrenceModificationState.COMPLETED
			);
		} else {
			modification.markAsCompleted();
		}

		await this._recurrenceModificationsRepository.persist(modification);
		return modification;
	}

	async markOccurrenceAsDeleted(
		scheduledItemId: Nanoid,
		occurrenceIndex: NumberValueObject
	): Promise<RecurrenceModification> {
		let modification = await this.getByScheduledItemIdAndOccurrenceIndex(
			scheduledItemId,
			occurrenceIndex.value
		);

		if (!modification) {
			// Create new modification with deleted state
			const scheduledTransaction =
				await this._scheduledTransactionsRepository.findById(
					scheduledItemId
				);
			const modificationDate =
				scheduledTransaction?.getOccurrenceDate(occurrenceIndex);
			if (!modificationDate) {
				throw new Error(
					`Cannot mark occurrence at index ${occurrenceIndex} as deleted - error getting original date`
				);
			}
			modification = RecurrenceModification.create(
				scheduledItemId,
				occurrenceIndex,
				modificationDate,
				RecurrenceModificationState.DELETED
			);
		} else {
			modification.markAsDeleted();
		}

		await this._recurrenceModificationsRepository.persist(modification);
		return modification;
	}

	async resetOccurrenceToPending(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
	): Promise<void> {
		const modification = await this.getByScheduledItemIdAndOccurrenceIndex(
			scheduledItemId,
			occurrenceIndex
		);

		if (modification) {
			// If the modification only has state changes and no other modifications,
			// we can delete it entirely (since pending is the default)
			if (
				!modification.hasModifications() ||
				(modification.state !== RecurrenceModificationState.PENDING &&
					!modification.date &&
					!modification.fromSplits &&
					!modification.toSplits)
			) {
				await this._recurrenceModificationsRepository.deleteById(
					modification.id
				);
			} else {
				modification.markAsPending();
				await this._recurrenceModificationsRepository.persist(
					modification
				);
			}
		}
		// If no modification exists, the occurrence is already in pending state
	}

	async clearAllModifications(scheduledItemId: Nanoid): Promise<void> {
		const modifications = await this.getByScheduledItemId(scheduledItemId);

		for (const modification of modifications) {
			modification.clearModifications();
			// If modification has no changes after clearing, delete it
			if (!modification.hasModifications()) {
				await this._recurrenceModificationsRepository.deleteById(
					modification.id
				);
			} else {
				await this._recurrenceModificationsRepository.persist(
					modification
				);
			}
		}
	}

	async deleteModificationsByScheduledItem(
		scheduledItemId: Nanoid
	): Promise<void> {
		await this._recurrenceModificationsRepository.deleteByScheduledItemId(
			scheduledItemId
		);
	}

	async countModificationsByScheduledItem(
		scheduledItemId: Nanoid
	): Promise<number> {
		return await this._recurrenceModificationsRepository.countByScheduledItemId(
			scheduledItemId
		);
	}

	async getStatsByScheduledItem(scheduledItemId: Nanoid): Promise<{
		total: number;
		pending: number;
		completed: number;
		skipped: number;
		deleted: number;
	}> {
		const modifications = await this.getByScheduledItemId(scheduledItemId);

		const stats = {
			total: modifications.length,
			pending: 0,
			completed: 0,
			skipped: 0,
			deleted: 0,
		};

		for (const modification of modifications) {
			switch (modification.state) {
				case RecurrenceModificationState.PENDING:
					stats.pending++;
					break;
				case RecurrenceModificationState.COMPLETED:
					stats.completed++;
					break;
				case RecurrenceModificationState.SKIPPED:
					stats.skipped++;
					break;
				case RecurrenceModificationState.DELETED:
					stats.deleted++;
					break;
			}
		}

		return stats;
	}
}
