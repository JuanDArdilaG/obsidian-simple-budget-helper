import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "../domain/item-brand.valueobject";
import { ItemCategory } from "../domain/item-category.valueobject";
import { ItemName } from "../domain/item-name.valueobject";
import { ItemPrice } from "../domain/item-price.valueobject";
import { IItemsRepository } from "../domain/item-repository.interface";
import { ItemStore } from "../domain/item-store.valueobject";
import { ItemSubcategory } from "../domain/item-subcategory.valueobject";
import { ItemOperation } from "../domain/item-operation.valueobject";
import { ItemID } from "../domain/item-id.valueobject";
import { SimpleItem } from "../domain/simple-item.entity";

export type CreateSimpleItemUseCaseInput = {
	id: ItemID;
	operation: ItemOperation;
	name: ItemName;
	amount: ItemPrice;
	category: ItemCategory;
	subCategory: ItemSubcategory;
	account: AccountID;
	brand?: ItemBrand;
	store?: ItemStore;
	toAccount?: AccountID;
};

export class CreateSimpleItemUseCase {
	constructor(private _repository: IItemsRepository) {}

	async execute({
		id,
		operation,
		name,
		amount,
		category,
		subCategory,
		account,
		brand,
		store,
		toAccount,
	}: CreateSimpleItemUseCaseInput): Promise<void> {
		let item = new SimpleItem(
			id,
			operation,
			name,
			amount,
			category,
			subCategory,
			account,
			brand,
			store,
			toAccount
		);

		await this._repository.persist(item);
	}
}
