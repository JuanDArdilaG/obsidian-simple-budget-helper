import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { AccountName } from "../domain/account-name.valueobject";
import { IAccountsRepository } from "../domain/accounts-repository.interface";

export type GetAllAccountNamesUseCaseOutput = AccountName[];

export class GetAllAccountNamesUseCase
	implements QueryUseCase<void, GetAllAccountNamesUseCaseOutput>
{
	constructor(private _accountsRepository: IAccountsRepository) {}

	async execute(): Promise<GetAllAccountNamesUseCaseOutput> {
		return await this._accountsRepository.findAllNames();
	}
}
