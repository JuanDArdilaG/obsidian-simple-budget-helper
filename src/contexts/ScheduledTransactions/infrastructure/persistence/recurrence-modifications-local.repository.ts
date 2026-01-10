import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { Nanoid } from "../../../Shared/domain";
import { Logger } from "../../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsRepository,
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "../../domain";

export class RecurrenceModificationsLocalRepository
	extends LocalRepository<
		Nanoid,
		RecurrenceModification,
		RecurrenceModificationPrimitives
	>
	implements IRecurrenceModificationsRepository
{
	#logger = new Logger("RecurrenceModificationsLocalRepository");
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.scheduledTransactionsModificationsTableName);
	}

	protected mapToDomain(
		record: RecurrenceModificationPrimitives
	): RecurrenceModification {
		return RecurrenceModification.fromPrimitives(record);
	}

	protected mapToPrimitives(
		entity: RecurrenceModification
	): RecurrenceModificationPrimitives {
		return entity.toPrimitives();
	}

	async findByScheduledItemId(
		scheduledItemId: Nanoid
	): Promise<RecurrenceModification[]> {
		return this.where("scheduledItemId", scheduledItemId.value);
	}

	async findByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number
	): Promise<RecurrenceModification | null> {
		const modification = await this._db.db
			.table(this.tableName)
			.where("scheduledItemId")
			.equals(scheduledItemId.value)
			.and(
				(modification: RecurrenceModificationPrimitives) =>
					modification.index === occurrenceIndex
			)
			.first();
		this.#logger.debug("findByScheduledItemIdAndOccurrenceIndex result", {
			modification,
		});

		if (!modification) {
			return null;
		}

		return this.mapToDomain(modification);
	}

	async deleteByScheduledItemId(scheduledItemId: Nanoid): Promise<void> {
		await this._db.db
			.table(this.tableName)
			.where("scheduledItemId")
			.equals(scheduledItemId.value)
			.delete();
	}

	async countByScheduledItemId(scheduledItemId: Nanoid): Promise<number> {
		return await this._db.db
			.table(this.tableName)
			.where("scheduledItemId")
			.equals(scheduledItemId.value)
			.count();
	}
}
