import { Logger } from "../../Shared/infrastructure/logger";
import { Item } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("CreateRegularItemUseCase");

export type CreateRegularItemUseCaseInput = Item;

export class CreateRegularItemUseCase {
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(item: CreateRegularItemUseCaseInput): Promise<void> {
		logger.debug("item to persist", {
			item: item.toPrimitives(),
		});

		await this._itemsRepository.persist(item);
	}
}
