import { CommandUseCase } from "contexts/Shared/domain";
import { ItemID } from "contexts/SimpleItems/domain";
import { SimpleItemsService } from "./simple-items.service";

export type DeleteSimpleItemUseCaseInput = ItemID;

export class DeleteSimpleItemUseCase
	implements CommandUseCase<DeleteSimpleItemUseCaseInput>
{
	constructor(private _itemsService: SimpleItemsService) {}

	async execute(id: ItemID): Promise<void> {
		await this._itemsService.delete(id);
	}
}
