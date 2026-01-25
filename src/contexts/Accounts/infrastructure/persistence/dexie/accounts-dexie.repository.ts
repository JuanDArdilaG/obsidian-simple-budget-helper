import {
	Account,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { DexieRepository } from "contexts/Shared/infrastructure/persistence/dexie/dexie.repository";

export class AccountsDexieRepository
	extends DexieRepository<Account, string, AccountPrimitives>
	implements IAccountsRepository
{
	constructor(protected readonly _db: DexieDB) {
		super(_db, Config.accountsTableName);
	}

	async findByName(name: AccountName): Promise<Account | null> {
		const record = await this._table
			.where("name")
			.equals(name.toString())
			.limit(1)
			.first();
		if (!record) return null;
		return this.mapToDomain(record);
	}

	protected mapToDomain(
		record: Record<string, string | number | Date>,
	): Account {
		return Account.fromPrimitives(record as AccountPrimitives);
	}
}
