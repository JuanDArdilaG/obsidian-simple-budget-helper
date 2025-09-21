import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { Item } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

export type GetAllRegularItemsUseCaseOutput = {
	items: Item[];
};

export class GetAllRegularItemsUseCase
	implements QueryUseCase<void, GetAllRegularItemsUseCaseOutput>
{
	readonly #logger = new Logger("GetAllRegularItemsUseCase");
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllRegularItemsUseCaseOutput> {
		const items = await this._itemsRepository.findAll();
		this.#logger.debugB("get all regular items", { items }).log();

		return {
			items: items.sort((a, b) =>
				a.name.value.localeCompare(b.name.value)
			),
		};
	}
}
