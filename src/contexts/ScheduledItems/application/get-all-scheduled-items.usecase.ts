import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import { ScheduledItemsService } from "./scheduled-items.service";

export type GetAllScheduledItemsUseCaseOutput = ScheduledItem[];

export class GetAllScheduledItemsUseCase
	implements QueryUseCase<void, GetAllScheduledItemsUseCaseOutput>
{
	constructor(private _scheduledItemsService: ScheduledItemsService) {}

	async execute(): Promise<GetAllScheduledItemsUseCaseOutput> {
		return await this._scheduledItemsService.getAll();
	}
}
