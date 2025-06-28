import { NumberValueObject } from "@juandardilag/value-objects";
import { IAccountsService } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	IScheduledItemsRepository,
	ItemID,
	ItemPrice,
	ItemRecurrenceInfo,
	ScheduledItem,
	ScheduledItemPrimitives,
} from "contexts/Items/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	SubCategoryID,
} from "contexts/Subcategories/domain";
import { IItemsService } from "../domain/items-service.interface";

export class ItemsService
	extends Service<ItemID, ScheduledItem, ScheduledItemPrimitives>
	implements IItemsService
{
	constructor(
		private readonly _scheduledItemsRepository: IScheduledItemsRepository,
		private readonly _accountsService: IAccountsService,
		private readonly subcategoriesService: ISubCategoriesService
	) {
		super("ScheduledItem", _scheduledItemsRepository);
	}

	async getByCategory(category: CategoryID): Promise<ScheduledItem[]> {
		return this._scheduledItemsRepository.findByCategory(category);
	}

	async getBySubCategory(
		subCategory: SubCategoryID
	): Promise<ScheduledItem[]> {
		return this._scheduledItemsRepository.findBySubCategory(subCategory);
	}

	async hasItemsByCategory(category: CategoryID): Promise<boolean> {
		const items = await this.getByCategory(category);
		return items.length > 0;
	}

	async hasItemsBySubCategory(subCategory: SubCategoryID): Promise<boolean> {
		const items = await this.getBySubCategory(subCategory);
		return items.length > 0;
	}

	async reassignItemsCategory(
		oldCategory: CategoryID,
		newCategory: CategoryID
	): Promise<void> {
		const items = await this.getByCategory(oldCategory);

		for (const item of items) {
			item.updateCategory(newCategory);
			await this._scheduledItemsRepository.persist(item);
		}
	}

	async reassignItemsSubCategory(
		oldSubCategory: SubCategoryID,
		newSubCategory: SubCategoryID
	): Promise<void> {
		const items = await this.getBySubCategory(oldSubCategory);

		// Get the new subcategory to find its parent category
		const newSubCategoryEntity = await this.subcategoriesService.getByID(
			newSubCategory
		);
		const newCategory = newSubCategoryEntity.category;

		for (const item of items) {
			item.updateSubCategory(newSubCategory);
			item.updateCategory(newCategory);
			await this._scheduledItemsRepository.persist(item);
		}
	}

	async modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo
	): Promise<void> {
		const item = await this.getByID(id);
		if (!item.recurrence)
			throw new InvalidArgumentError(
				"Scheduled Item",
				id.toString(),
				"item doesn't have recurrence"
			);
		item.recurrence.recurrences[n.value] = newRecurrence;
		await this._scheduledItemsRepository.persist(item);
	}

	/**
	 * Calculates the price per month for an item with proper transfer logic.
	 * For transfers, the sign depends on the account types involved.
	 */
	async getPricePerMonth(itemID: ItemID): Promise<ItemPrice> {
		const item = await this.getByID(itemID);

		// For transfers, we need to get account types
		if (item.operation.type.isTransfer()) {
			// Get account types for the first from and to splits
			if (item.fromSplits.length > 0 && item.toSplits.length > 0) {
				const fromAccount = await this._accountsService.getByID(
					item.fromSplits[0].accountId
				);
				const toAccount = await this._accountsService.getByID(
					item.toSplits[0].accountId
				);

				const fromType = fromAccount.type;
				const toType = toAccount.type;

				// Asset to Liability: negative (expense)
				if (fromType.isAsset() && toType.isLiability()) {
					return item.fromAmount
						.negate()
						.times(item.recurrence.perMonthRelation);
				}
				// Liability to Asset: positive (income)
				else if (fromType.isLiability() && toType.isAsset()) {
					return item.fromAmount.times(
						item.recurrence.perMonthRelation
					);
				}
				// Asset to Asset or Liability to Liability: neutral (zero)
				else {
					return ItemPrice.zero();
				}
			}
			return ItemPrice.zero();
		}

		// For income/expense, use the existing logic
		if (item.operation.type.isIncome()) {
			return item.fromAmount.times(item.recurrence.perMonthRelation);
		} else if (item.operation.type.isExpense()) {
			return item.fromAmount
				.negate()
				.times(item.recurrence.perMonthRelation);
		}

		return ItemPrice.zero();
	}
}
