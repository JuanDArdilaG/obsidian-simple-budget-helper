import { AccountID } from "contexts/Accounts/domain";
import {
	RecurrrentItemFrequency,
	RecurrentItemNextDate,
	RecurrentItem,
	ItemID,
} from "contexts/Items/domain";
import {
	IItemsRepository,
	ItemBrand,
	ItemName,
	ItemOperation,
	ItemPrice,
	ItemStore,
} from "contexts/Items/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubcategoryID } from "contexts/Subcategories/domain";

export type CreateRecurrentItemUseCaseInput = {
	id: ItemID;
	operation: ItemOperation;
	name: ItemName;
	amount: ItemPrice;
	category: CategoryID;
	subCategory: SubcategoryID;
	account: AccountID;
	frequency: RecurrrentItemFrequency;
	nextDate: RecurrentItemNextDate;
	brand?: ItemBrand;
	store?: ItemStore;
	toAccount?: AccountID;
};

export class CreateRecurrentItemUseCase {
	constructor(private _repository: IItemsRepository) {}

	async execute({
		id,
		operation,
		name,
		amount,
		category,
		subCategory,
		account,
		frequency,
		nextDate,
		brand,
		store,
		toAccount,
	}: CreateRecurrentItemUseCaseInput): Promise<void> {
		let item = new RecurrentItem(
			id,
			operation,
			name,
			amount,
			category,
			subCategory,
			account,
			nextDate,
			frequency,
			brand,
			store,
			toAccount
		);

		await this._repository.persist(item);
	}
}
