import { QueryUseCase } from "contexts/Shared/domain";
import { Account, IAccountsRepository } from "contexts/Accounts/domain";

export type GetAllAccountsUseCaseOutput = Account[];

export class GetAllAccountsUseCase
	implements QueryUseCase<void, GetAllAccountsUseCaseOutput>
{
	constructor(private readonly _accountsRepository: IAccountsRepository) {}

	async execute(): Promise<GetAllAccountsUseCaseOutput> {
		return await this._accountsRepository.findAll();
	}
}
