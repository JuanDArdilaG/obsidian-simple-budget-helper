import { StringValueObject } from "@juandardilag/value-objects";
import { IAccountsService } from "contexts/Accounts/domain/accounts-service.interface";
import { CommandUseCase, Nanoid } from "../../Shared/domain";

export class ChangeAccountNameUseCase implements CommandUseCase<{
	id: Nanoid;
	name: StringValueObject;
}> {
	constructor(private readonly _accountsService: IAccountsService) {}

	async execute({
		id,
		name,
	}: {
		id: Nanoid;
		name: StringValueObject;
	}): Promise<void> {
		const account = await this._accountsService.getByID(id.value);
		account.name = name;
		await this._accountsService.update(account);
	}
}
