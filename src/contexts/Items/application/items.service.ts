import {
	IItemsRepository,
	Item,
	RecurrentItem,
	RecurrentItemsCriteria,
} from "contexts/Items/domain";

export class ItemsService {
	constructor(private _itemsRepository: IItemsRepository) {}

	async getAll(): Promise<Item[]> {
		return await this._itemsRepository.findAll();
	}

	async getAllRecurrent(): Promise<RecurrentItem[]> {
		return (
			await this._itemsRepository.findByCriteria(
				new RecurrentItemsCriteria().where(
					"nextDate",
					undefined,
					"NOT_EQUAL"
				)
			)
		).filter((item) => RecurrentItem.IsRecurrent(item));
	}
}
