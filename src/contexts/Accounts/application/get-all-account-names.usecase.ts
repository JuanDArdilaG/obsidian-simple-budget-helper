import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IAccountsService, AccountName } from "../domain";

export type GetAllAccountNamesUseCaseOutput = AccountName[];

export class GetAllAccountNamesUseCase
	implements QueryUseCase<void, GetAllAccountNamesUseCaseOutput>
{
	constructor(private _accountsService: IAccountsService) {}

	async execute(): Promise<GetAllAccountNamesUseCaseOutput> {
		return await this._accountsService.getAllNames();
	}
}
