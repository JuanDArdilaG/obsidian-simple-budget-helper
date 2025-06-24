import { NumberValueObject } from "@juandardilag/value-objects";
import { IAccountsService } from "contexts/Accounts/domain";
import {
	IItemsRepository,
	Item,
	ItemID,
	ItemPrice,
	ItemPrimitives,
	ItemRecurrenceInfo,
} from "contexts/Items/domain";
import { Service } from "contexts/Shared/application/service.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain";
import { IItemsService } from "../domain/items-service.interface";

export class ItemsService
	extends Service<ItemID, Item, ItemPrimitives>
	implements IItemsService
{
	constructor(
		private readonly _itemsRepository: IItemsRepository,
		private readonly _accountsService: IAccountsService
	) {
		super("Item", _itemsRepository);
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
		await this._itemsRepository.persist(item);
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
