import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { AccountName } from "../domain/account-name.valueobject";
import { AccountsService } from "./accounts.service";

export type GetAllAccountNamesUseCaseOutput = AccountName[];

export class GetAllAccountNamesUseCase
	implements QueryUseCase<void, GetAllAccountNamesUseCaseOutput>
{
	constructor(private _accountsService: AccountsService) {}

	async execute(): Promise<GetAllAccountNamesUseCaseOutput> {
		return await this._accountsService.getAllNames();
	}
}
