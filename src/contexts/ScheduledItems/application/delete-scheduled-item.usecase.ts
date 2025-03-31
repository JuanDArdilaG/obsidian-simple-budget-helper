import { CommandUseCase } from "contexts/Shared/domain";
import { ItemID } from "contexts/SimpleItems/domain";
import { ScheduledItemsService } from "./scheduled-items.service";

export type DeleteScheduledItemUseCaseInput = ItemID;

export class DeleteScheduledItemUseCase
	implements CommandUseCase<DeleteScheduledItemUseCaseInput>
{
	constructor(private _scheduledItemsService: ScheduledItemsService) {}

	async execute(id: ItemID): Promise<void> {
		await this._scheduledItemsService.delete(id);
	}
}
