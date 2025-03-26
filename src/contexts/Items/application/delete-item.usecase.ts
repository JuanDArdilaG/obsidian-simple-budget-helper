import { AccountID } from "contexts/Accounts/domain";
import { CommandUseCase } from "contexts/Shared/domain";
import { IItemsRepository, ItemID } from "contexts/Items/domain";

export type DeleteItemUseCaseInput = ItemID;

export class DeleteItemUseCase
	implements CommandUseCase<DeleteItemUseCaseInput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(id: ItemID): Promise<void> {
		await this._itemsRepository.deleteById(id);
	}
}
