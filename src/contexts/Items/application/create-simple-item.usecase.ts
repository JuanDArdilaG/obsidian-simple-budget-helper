import { IItemsRepository } from "../domain/item-repository.interface";
import { SimpleItem } from "../domain/simple-item.entity";
import { Logger } from "../../Shared/infrastructure/logger";

export type CreateSimpleItemUseCaseInput = SimpleItem;

export class CreateSimpleItemUseCase {
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(item: CreateSimpleItemUseCaseInput): Promise<void> {
		Logger.debug("simple item to persist", { item: item.toPrimitives() });

		await this._itemsRepository.persist(item);
	}
}
