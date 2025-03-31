import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";
import {
	ITransactionsRepository,
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export class TransactionsDexieRepository
	extends DexieRepository<Transaction, TransactionID, TransactionPrimitives>
	implements ITransactionsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.transactionsTableName);
	}

	protected mapToDomain(record: TransactionPrimitives): Transaction {
		return Transaction.fromPrimitives(record);
	}
}
