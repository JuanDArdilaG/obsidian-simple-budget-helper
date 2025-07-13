import { EntityNotFoundError } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { Item } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("UpdateRegularItemUseCase");

export class UpdateRegularItemUseCase {
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(item: Item): Promise<void> {
		logger.debug("item to update", {
			item: item.toPrimitives(),
		});

		if (!(await this._itemsRepository.exists(item.id)))
			throw new EntityNotFoundError("Item", item.id);

		await this._itemsRepository.persist(item);
	}
}
