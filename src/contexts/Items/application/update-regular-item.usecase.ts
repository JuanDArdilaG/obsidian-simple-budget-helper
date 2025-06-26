import { Logger } from "../../Shared/infrastructure/logger";
import { Item } from "../domain";
import { IItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("UpdateRegularItemUseCase");

export type UpdateRegularItemUseCaseInput = Item;

export class UpdateRegularItemUseCase {
	constructor(private readonly _itemsRepository: IItemsRepository) {}

	async execute(item: UpdateRegularItemUseCaseInput): Promise<void> {
		logger.debug("item to update", {
			item: item.toPrimitives(),
		});

		await this._itemsRepository.persist(item);
	}
}
