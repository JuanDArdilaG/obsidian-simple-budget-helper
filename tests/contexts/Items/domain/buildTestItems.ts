import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemName,
	ItemPrice,
	ItemRecurrenceFrequency,
	ScheduledItem,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";

type ItemConfig = {
	price?: ItemPrice;
	account?: AccountID;
	toAccount?: AccountID;
	operation?: ItemOperation;
	recurrence?: {
		frequency?: string;
		startDate?: DateValueObject;
		untilDate?: DateValueObject;
	};
};

// Helper to create splits for test items
function makeSplits(account?: AccountID, amount: number = 100): PaymentSplit[] {
	return account
		? [new PaymentSplit(account, new TransactionAmount(Math.abs(amount)))]
		: [];
}

export const buildTestItems = (
	config: ItemConfig[] | number
): ScheduledItem[] => {
	let items: ScheduledItem[] = [];
	if (typeof config === "number") {
		for (let i = 0; i < config; i++) {
			const fromSplits = makeSplits(AccountID.generate(), 100);
			const toSplits: PaymentSplit[] = [];
			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("test"),
				fromSplits,
				toSplits,
				ItemOperation.expense(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);
			items.push(item);
		}
	} else {
		items = config.map(
			({ price, operation, recurrence, account, toAccount }) => {
				const startDate =
					recurrence?.startDate ?? DateValueObject.createNowDate();
				const absPrice = price ? Math.abs(price.value) : 100;

				// Determine the accounts to use for splits
				const fromAccount = account || AccountID.generate();
				const toAccountForSplits =
					toAccount ||
					(operation?.type.isTransfer()
						? AccountID.generate()
						: undefined);

				const fromSplits = makeSplits(fromAccount, absPrice);
				const toSplits = makeSplits(toAccountForSplits, absPrice);

				// Ensure transfer operations have toSplits
				const finalToSplits =
					operation?.type.isTransfer() && toSplits.length === 0
						? makeSplits(AccountID.generate(), absPrice)
						: toSplits;

				let item = ScheduledItem.oneTime(
					startDate,
					new ItemName("test"),
					fromSplits,
					finalToSplits,
					operation ?? ItemOperation.expense(),
					CategoryID.generate(),
					SubCategoryID.generate()
				);
				if (recurrence?.frequency) {
					item = ScheduledItem.infinite(
						startDate,
						new ItemName("test"),
						fromSplits,
						finalToSplits,
						operation ?? ItemOperation.expense(),
						CategoryID.generate(),
						SubCategoryID.generate(),
						new ItemRecurrenceFrequency(recurrence.frequency)
					);
					if (recurrence.untilDate) {
						const adjustedUntilDate =
							recurrence.untilDate.value <= startDate.value
								? new DateValueObject(
										new Date(
											startDate.value.getTime() +
												24 * 60 * 60 * 1000
										)
								  ) // Add 1 day
								: recurrence.untilDate;

						item = ScheduledItem.untilDate(
							new ItemName("test"),
							fromSplits,
							finalToSplits,
							operation ?? ItemOperation.expense(),
							CategoryID.generate(),
							SubCategoryID.generate(),
							new ItemRecurrenceFrequency(recurrence.frequency),
							startDate,
							adjustedUntilDate
						);
					}
				}

				return item;
			}
		);
	}

	return items;
};
