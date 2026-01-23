import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import {
	LocalRepository,
	RepositoryDependencies,
} from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { Account, IAccountsRepository } from "../../../Accounts/domain";
import { Nanoid } from "../../../Shared/domain";
import { Logger } from "../../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsRepository,
	RecurrenceModification,
	RecurrenceModificationPrimitives,
} from "../../domain";

export type RecurrenceModificationsDependencies =
	RepositoryDependencies<Account>;

export class RecurrenceModificationsLocalRepository
	extends LocalRepository<
		Nanoid,
		RecurrenceModification,
		RecurrenceModificationPrimitives
	>
	implements IRecurrenceModificationsRepository
{
	static readonly #logger = new Logger(
		"RecurrenceModificationsLocalRepository",
	);
	constructor(
		protected readonly _db: LocalDB,
		private readonly _accountsRepository: IAccountsRepository,
	) {
		super(_db, Config.scheduledTransactionsModificationsTableName, [
			{ type: "Account", getter: _accountsRepository.findAll },
		]);
	}

	protected mapToDomain(
		record: RecurrenceModificationPrimitives,
		dependencies?: RecurrenceModificationsDependencies,
	): RecurrenceModification {
		const accounts = dependencies
			? dependencies.get("Account")!
			: new Map<string, Account>();
		return RecurrenceModification.fromPrimitives(accounts, record);
	}

	protected mapToPrimitives(
		entity: RecurrenceModification,
	): RecurrenceModificationPrimitives {
		return entity.toPrimitives();
	}

	async findByScheduledItemId(
		scheduledItemId: Nanoid,
	): Promise<RecurrenceModification[]> {
		return this.where("scheduledItemId", scheduledItemId.value);
	}

	async findByScheduledItemIdAndOccurrenceIndex(
		scheduledItemId: Nanoid,
		occurrenceIndex: number,
	): Promise<RecurrenceModification | null> {
		const modification = await this._db.db
			.table(this.tableName)
			.where("scheduledItemId")
			.equals(scheduledItemId.value)
			.and(
				(modification: RecurrenceModificationPrimitives) =>
					modification.index === occurrenceIndex,
			)
			.first();
		RecurrenceModificationsLocalRepository.#logger.debug(
			"findByScheduledItemIdAndOccurrenceIndex result",
			{
				modification,
			},
		);

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
