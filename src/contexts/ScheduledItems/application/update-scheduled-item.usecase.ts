import { CommandUseCase } from "contexts/Shared/domain";
import { ScheduledItem } from "../domain";
import { ScheduledItemsService } from "./scheduled-items.service";

export type UpdateScheduledItemUseCaseInput = ScheduledItem;

export class UpdateScheduledItemUseCase
	implements CommandUseCase<UpdateScheduledItemUseCaseInput>
{
	constructor(private _scheduledItemsService: ScheduledItemsService) {}

	async execute(item: ScheduledItem): Promise<void> {
		await this._scheduledItemsService.update(item);
	}
}
