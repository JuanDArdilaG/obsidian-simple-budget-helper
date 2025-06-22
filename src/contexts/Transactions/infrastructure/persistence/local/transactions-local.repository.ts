import { ItemBrand, ItemStore } from "contexts/Items/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import {
	ITransactionsRepository,
	Transaction,
	TransactionID,
	TransactionPrimitives,
} from "contexts/Transactions/domain";

export class TransactionsLocalRepository
	extends LocalRepository<TransactionID, Transaction, TransactionPrimitives>
	implements ITransactionsRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.transactionsTableName);
	}

	async findAllUniqueItemBrands(): Promise<ItemBrand[]> {
		const allRecords = await this.findAll();
		const uniqueBrands = new Set<string>();

		allRecords.forEach((transaction) => {
			const primitives = transaction.toPrimitives();
			if (primitives.brand) {
				uniqueBrands.add(primitives.brand);
			}
		});

		return Array.from(uniqueBrands).map((brand) => new ItemBrand(brand));
	}

	async findAllUniqueItemStores(): Promise<ItemStore[]> {
		const allRecords = await this.findAll();
		const uniqueStores = new Set<string>();

		allRecords.forEach((transaction) => {
			const primitives = transaction.toPrimitives();
			if (primitives.store) {
				uniqueStores.add(primitives.store);
			}
		});

		return Array.from(uniqueStores).map((store) => new ItemStore(store));
	}

	protected mapToDomain(record: TransactionPrimitives): Transaction {
		return Transaction.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Transaction): TransactionPrimitives {
		return entity.toPrimitives();
	}
}
