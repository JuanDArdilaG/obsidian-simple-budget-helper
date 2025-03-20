import {
	Account,
	AccountID,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import {
	Config,
	DexieDB,
	DexieRepository,
} from "contexts/Shared/infrastructure";
import { Logger } from "contexts/Shared/infrastructure";

export class AccountsDexieRepository
	extends DexieRepository<Account, AccountID, AccountPrimitives>
	implements IAccountsRepository
{
	constructor(config: typeof Config, protected readonly _db: DexieDB) {
		super(_db, config.accountsTableName);
	}

	async findAllNames(): Promise<AccountName[]> {
		return (await this._table.toArray()).map(
			(r) => this.mapToDomain(r).name
		);
	}

	protected mapToDomain(
		record: Record<string, string | number | Date>
	): Account {
		return Account.fromPrimitives(record as AccountPrimitives);
	}
}
