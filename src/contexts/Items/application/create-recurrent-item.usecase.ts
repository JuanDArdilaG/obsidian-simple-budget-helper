import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "../domain/item-brand.valueobject";
import { ItemCategory } from "../domain/item-category.valueobject";
import { ItemName } from "../domain/item-name.valueobject";
import { ItemPrice } from "../domain/item-price.valueobject";
import { IItemsRepository } from "../domain/item-repository.interface";
import { ItemStore } from "../domain/item-store.valueobject";
import { ItemSubcategory } from "../domain/item-subcategory.valueobject";
import { ItemOperation } from "../domain/item-operation.valueobject";
import { RecurrrentItemFrequency } from "../domain/RecurrentItem/recurrent-item-frequency.valueobject";
import { RecurrentItemNextDate } from "../domain/RecurrentItem/recurrent-item-nextdate.valueobject";
import { RecurrentItem } from "../domain/RecurrentItem/recurrent-item.entity";
import { ItemID } from "../domain/item-id.valueobject";

export type CreateRecurrentItemUseCaseInput = {
	id: ItemID;
	operation: ItemOperation;
	name: ItemName;
	amount: ItemPrice;
	category: ItemCategory;
	subCategory: ItemSubcategory;
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
