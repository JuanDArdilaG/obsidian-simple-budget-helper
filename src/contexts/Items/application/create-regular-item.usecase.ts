import { InvalidArgumentError } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { Item } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("CreateRegularItemUseCase");

export class CreateRegularItemUseCase {
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(item: Item): Promise<void> {
		logger.debug("item to persist", {
			item: item.toPrimitives(),
		});

		if (await this._itemsRepository.exists(item.id))
			throw new InvalidArgumentError(
				"Item",
				item.id.toString(),
				"Item already exists"
			);

		await this._itemsRepository.persist(item);
	}
}
