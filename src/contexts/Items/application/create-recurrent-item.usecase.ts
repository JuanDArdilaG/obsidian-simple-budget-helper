import { RecurrentItem } from "contexts/Items/domain";
import { IItemsRepository } from "contexts/Items/domain";

export type CreateRecurrentItemUseCaseInput = RecurrentItem;

export class CreateRecurrentItemUseCase {
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(item: CreateRecurrentItemUseCaseInput): Promise<void> {
		await this._itemsRepository.persist(item);
	}
}
