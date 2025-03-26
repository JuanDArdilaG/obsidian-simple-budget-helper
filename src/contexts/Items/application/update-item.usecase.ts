import { CommandUseCase } from "contexts/Shared/domain";
import { IItemsRepository, Item } from "contexts/Items/domain";

export type UpdateItemUseCaseInput = Item;

export class UpdateItemUseCase
	implements CommandUseCase<UpdateItemUseCaseInput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(item: Item): Promise<void> {
		await this._itemsRepository.persist(item);
	}
}
