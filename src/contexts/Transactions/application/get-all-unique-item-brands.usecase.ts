import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ItemBrand } from "contexts/Items/domain";
import { ITransactionsRepository } from "../domain";

export type GetAllUniqueItemBrandsUseCaseOutput = ItemBrand[];

export class GetAllUniqueItemBrandsUseCase
	implements QueryUseCase<void, GetAllUniqueItemBrandsUseCaseOutput>
{
	constructor(
		private readonly _transactionsRepository: ITransactionsRepository
	) {}

	async execute(): Promise<GetAllUniqueItemBrandsUseCaseOutput> {
		return await this._transactionsRepository.findAllUniqueItemBrands();
	}
}
