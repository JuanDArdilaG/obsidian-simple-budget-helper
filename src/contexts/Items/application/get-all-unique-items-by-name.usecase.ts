import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IItemsRepository, Item } from "../domain";
import { Logger } from "contexts/Shared";

const logger = new Logger("GetAllUniqueItemsByNameUseCase").off();

export type GetAllUniqueItemsByNameUseCaseOutput = Item[];

export class GetAllUniqueItemsByNameUseCase
	implements QueryUseCase<void, GetAllUniqueItemsByNameUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllUniqueItemsByNameUseCaseOutput> {
		const items = await this._itemsRepository.findAll();
		logger.debugB("get all items", { items }).log();
		return items
			.filter((item, index, self) => {
				return (
					index === self.findIndex((o) => o.name.equalTo(item.name))
				);
			})
			.sort((a, b) => a.name.value.localeCompare(b.name.value));
	}
}
