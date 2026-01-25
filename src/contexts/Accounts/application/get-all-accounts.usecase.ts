import { Account, IAccountsService } from "contexts/Accounts/domain";
import { QueryUseCase } from "contexts/Shared/domain";

export type AccountsMap = Map<string, Account>;

export class GetAllAccountsUseCase implements QueryUseCase<void, AccountsMap> {
	constructor(private readonly _accountsService: IAccountsService) {}

	async execute(): Promise<AccountsMap> {
		const accountsArray = await this._accountsService.getAll();
		const accountsMap: AccountsMap = new Map();
		accountsArray.forEach((account) => {
			accountsMap.set(account.id, account);
		});
		return accountsMap;
	}
}
