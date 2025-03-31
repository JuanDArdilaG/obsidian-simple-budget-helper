import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IItemsRepository, ItemBrand } from "contexts/SimpleItems/domain";

export type GetAllUniqueItemBrandsUseCaseOutput = ItemBrand[];

export class GetAllUniqueItemBrandsUseCase
	implements QueryUseCase<void, GetAllUniqueItemBrandsUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllUniqueItemBrandsUseCaseOutput> {
		return await this._itemsRepository.findAllUniqueItemBrands();
	}
}
