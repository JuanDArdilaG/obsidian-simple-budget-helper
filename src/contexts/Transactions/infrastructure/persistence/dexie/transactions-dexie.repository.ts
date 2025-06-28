import { AccountID } from "contexts/Accounts/domain";
import { ItemBrand, ItemStore } from "contexts/Items/domain";
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
	constructor(protected readonly _db: DexieDB) {
		super(_db, Config.transactionsTableName);
	}

	async findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		return (await this._table.orderBy("brand").uniqueKeys()).map(
			(brand) => new ItemBrand(brand.toString())
		);
	}

	async findAllUniqueItemStores(): Promise<ItemStore[]> {
		return (await this._table.orderBy("store").uniqueKeys()).map(
			(store) => new ItemStore(store.toString())
		);
	}

	async hasTransactionsForAccount(accountId: AccountID): Promise<boolean> {
		const allRecords = await this.findAll();

		return allRecords.some((transaction) => {
			const primitives = transaction.toPrimitives();
			// Check if the account is involved in any splits
			return (
				(primitives.fromSplits?.some(
					(split) => split.accountId === accountId.value
				) ??
					false) ||
				(primitives.toSplits?.some(
					(split) => split.accountId === accountId.value
				) ??
					false)
			);
		});
	}

	protected mapToDomain(record: TransactionPrimitives): Transaction {
		return Transaction.fromPrimitives(record);
	}
}
