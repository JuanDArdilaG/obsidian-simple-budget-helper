import { IItemsRepository } from "../domain/item-repository.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { Item } from "../domain";

const logger = new Logger("CreateItemUseCase");

export type CreateItemUseCaseInput = Item;

export class CreateItemUseCase {
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(item: CreateItemUseCaseInput): Promise<void> {
		logger.debug("item to persist", {
			item: item.toPrimitives(),
		});

		await this._itemsRepository.persist(item);
	}
}
