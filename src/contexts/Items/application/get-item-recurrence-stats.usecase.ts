import { ItemID } from "contexts/Items/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";

export type GetItemRecurrenceStatsUseCaseInput = {
	id: ItemID;
};

export type GetItemRecurrenceStatsUseCaseOutput = {
	active: number;
	completed: number;
	pending: number;
	deleted: number;
	total: number;
};

export class GetItemRecurrenceStatsUseCase
	implements
		QueryUseCase<
			GetItemRecurrenceStatsUseCaseInput,
			GetItemRecurrenceStatsUseCaseOutput
		>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute({
		id,
	}: GetItemRecurrenceStatsUseCaseInput): Promise<GetItemRecurrenceStatsUseCaseOutput> {
		return await this._itemsService.getRecurrenceStats(id);
	}
}
