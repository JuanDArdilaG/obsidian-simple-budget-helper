import { ItemID } from "../domain/item-id.valueobject";
import { ItemPrice } from "../domain/item-price.valueobject";
import { IItemsService } from "../domain/items-service.interface";

export class GetItemPricePerMonthUseCase {
	constructor(private readonly _itemsService: IItemsService) {}

	async execute(itemID: string): Promise<ItemPrice> {
		return await this._itemsService.getPricePerMonth(new ItemID(itemID));
	}
}
