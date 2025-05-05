import { CommandUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";
import { ItemID } from "../domain";

export type DeleteItemUseCaseInput = ItemID;

export class DeleteItemUseCase
	implements CommandUseCase<DeleteItemUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute(id: ItemID): Promise<void> {
		await this._itemsService.delete(id);
	}
}
