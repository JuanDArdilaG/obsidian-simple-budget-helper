import {
	IScheduledItemsRepository,
	ScheduledItem,
} from "contexts/ScheduledItems/domain";

export type CreateScheduledItemUseCaseInput = ScheduledItem;

export class CreateScheduledItemUseCase {
	constructor(private _scheduledItemsRepository: IScheduledItemsRepository) {}

	async execute(item: CreateScheduledItemUseCaseInput): Promise<void> {
		await this._scheduledItemsRepository.persist(item);
	}
}
