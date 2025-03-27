import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import {
	DexieDB,
	DexieRepository,
} from "contexts/Shared/infrastructure/persistence";
import { Config } from "contexts/Shared/infrastructure/config";

export class AccountsDexieRepository
	extends DexieRepository<Account, AccountID, AccountPrimitives>
	implements IAccountsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.accountsTableName);
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
		record: Record<string, string | number | Date>
	): Account {
		return Account.fromPrimitives(record as AccountPrimitives);
	}
}
