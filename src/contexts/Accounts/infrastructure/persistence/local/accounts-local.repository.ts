import {
	Account,
	AccountName,
	AccountPrimitives,
	IAccountsRepository,
} from "contexts/Accounts/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { LocalRepository } from "contexts/Shared/infrastructure/persistence/local/local.repository";
import { Nanoid } from "../../../../Shared/domain";

export class AccountsLocalRepository
	extends LocalRepository<Nanoid, Account, AccountPrimitives>
	implements IAccountsRepository
{
	constructor(protected readonly _db: LocalDB) {
		super(_db, Config.accountsTableName);
	}

	async findByName(name: AccountName): Promise<Account | null> {
		const records = await this.where("name", name.toString());
		return records.length > 0 ? records[0] : null;
	}

	protected mapToDomain(record: AccountPrimitives): Account {
		return Account.fromPrimitives(record);
	}

	protected mapToPrimitives(entity: Account): AccountPrimitives {
		return entity.toPrimitives();
	}
}
