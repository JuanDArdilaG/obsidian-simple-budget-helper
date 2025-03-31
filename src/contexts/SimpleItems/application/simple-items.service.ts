import { Service } from "contexts/Shared/application/service.abstract";
import { EntityNotFoundError } from "contexts/Shared/domain";
import {
	IItemsRepository,
	ItemID,
	ItemPrimitives,
	SimpleItem,
} from "contexts/SimpleItems/domain";

export class SimpleItemsService extends Service<
	ItemID,
	SimpleItem,
	ItemPrimitives
> {
	constructor(private _itemsRepository: IItemsRepository) {
		super("Simple Item", _itemsRepository);
	}
}
