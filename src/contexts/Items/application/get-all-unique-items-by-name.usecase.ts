import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IItemsRepository, Item } from "../domain";

export type GetAllUniqueItemsByNameUseCaseOutput = Item[];

export class GetAllUniqueItemsByNameUseCase
	implements QueryUseCase<void, GetAllUniqueItemsByNameUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllUniqueItemsByNameUseCaseOutput> {
		const items = await this._itemsRepository.findAll();
		return items
			.filter((item, index, self) => {
				return index === self.findIndex((o) => o.name.equal(item.name));
			})
			.sort((a, b) => a.name.value.localeCompare(b.name.value));
	}
}
