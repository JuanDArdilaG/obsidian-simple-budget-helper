import { EntityNotFoundError } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { ScheduledItem } from "../domain";
import { IScheduledItemsRepository } from "../domain/item-repository.interface";

const logger = new Logger("UpdateItemUseCase");

export class UpdateScheduledItemUseCase {
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute(item: ScheduledItem): Promise<void> {
		logger.debug("item to update", {
			item: item.toPrimitives(),
		});

		if (!(await this._scheduledItemsRepository.exists(item.id)))
			throw new EntityNotFoundError("Schedules Item", item.id);

		await this._scheduledItemsRepository.persist(item);
	}
}
