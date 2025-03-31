import { IItemsRepository } from "../domain/item-repository.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { Item, SimpleItem } from "../domain";

const logger = new Logger("CreateItemUseCase");

export type CreateItemUseCaseInput = SimpleItem;

export class CreateItemUseCase {
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(item: CreateItemUseCaseInput): Promise<void> {
		logger.debug("item to persist", {
			item: item.toPrimitives(),
		});

		await this._itemsRepository.persist(item);
	}
}
