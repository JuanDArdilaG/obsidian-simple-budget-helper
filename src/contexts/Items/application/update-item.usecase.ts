import { Logger } from "../../Shared/infrastructure/logger";
import { ScheduledItem } from "../domain";
import { IScheduledItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("UpdateItemUseCase");

export type UpdateItemUseCaseInput = ScheduledItem;

export class UpdateItemUseCase {
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute(item: UpdateItemUseCaseInput): Promise<void> {
		logger.debug("item to update", {
			item: item.toPrimitives(),
		});

		await this._scheduledItemsRepository.persist(item);
	}
}
