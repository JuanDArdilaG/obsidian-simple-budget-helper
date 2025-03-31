import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/ScheduledItems/domain";
import { RepositoryMock } from "../../Shared/domain/repository.mock";
import { ItemID } from "contexts/SimpleItems/domain";
import { IScheduledItemsRepository } from "contexts/ScheduledItems/domain/scheduled-item-repository.interface";

export class ScheduledItemsRepositoryMock
	extends RepositoryMock<ItemID, ScheduledItem, ScheduledItemPrimitives>
	implements IScheduledItemsRepository {}
