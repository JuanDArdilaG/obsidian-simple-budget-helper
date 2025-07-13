import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { EntityNotFoundError } from "../../Shared/domain";
import { Item, ItemID } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

export type GetRegularItemByIdUseCaseOutput = Item;

export class GetRegularItemByIdUseCase
	implements QueryUseCase<ItemID, GetRegularItemByIdUseCaseOutput>
{
	readonly #logger = new Logger("GetAllRegularItemsUseCase");
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(id: ItemID): Promise<GetRegularItemByIdUseCaseOutput> {
		this.#logger.debug("get regular item by id", { id });
		const item = await this._itemsRepository.findById(id);
		if (!item) throw new EntityNotFoundError("Item", id);

		return item;
	}
}
