import { IAccountsService } from "contexts/Accounts/domain/accounts-service.interface";
import { CommandUseCase, Nanoid } from "../../Shared/domain";
import { AccountSubtype } from "../domain";

export class ChangeAccountSubtypeUseCase implements CommandUseCase<{
	id: Nanoid;
	subtype: AccountSubtype;
}> {
	constructor(private readonly _accountsService: IAccountsService) {}

	async execute({
		id,
		subtype,
	}: {
		id: Nanoid;
		subtype: AccountSubtype;
	}): Promise<void> {
		const account = await this._accountsService.getByID(id);
		account.subtype = subtype;
		await this._accountsService.update(account);
	}
}
