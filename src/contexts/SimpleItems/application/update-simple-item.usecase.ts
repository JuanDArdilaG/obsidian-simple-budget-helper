import { CommandUseCase } from "contexts/Shared/domain";
import { SimpleItem } from "contexts/SimpleItems/domain";
import { SimpleItemsService } from "./simple-items.service";

export type UpdateSimpleItemUseCaseInput = SimpleItem;

export class UpdateSimpleItemUseCase
	implements CommandUseCase<UpdateSimpleItemUseCaseInput>
{
	constructor(private _itemsService: SimpleItemsService) {}

	async execute(item: SimpleItem): Promise<void> {
		await this._itemsService.update(item);
	}
}
