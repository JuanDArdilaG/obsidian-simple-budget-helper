import {
	DateValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import {
	ItemRecurrenceFrequency,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";

type ItemConfig = {
	price?: PriceValueObject;
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
): ScheduledTransaction[] => {
	let items: ScheduledTransaction[] = [];
	if (typeof config === "number") {
		for (let i = 0; i < config; i++) {
			const fromSplits = makeSplits(AccountID.generate(), 100);
			const toSplits: PaymentSplit[] = [];
			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("test"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.expense(),
				new TransactionCategory(
					Category.create(new CategoryName("Test")),
					SubCategory.create(
						CategoryID.generate(),
						new SubCategoryName("Test")
					)
				)
			);
			items.push(item);
		}
	} else {
		items = config.map(
			({ price, operation, recurrence, account, toAccount }) => {
				const startDate = recurrence?.startDate
					? new ScheduledTransactionDate(recurrence.startDate)
					: ScheduledTransactionDate.createNowDate();
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

				let item = ScheduledTransaction.createOneTime(
					new StringValueObject("test"),
					startDate,
					fromSplits,
					finalToSplits,
					operation ?? ItemOperation.expense(),
					new TransactionCategory(
						Category.create(new CategoryName("Test")),
						SubCategory.create(
							CategoryID.generate(),
							new SubCategoryName("Test")
						)
					)
				);
				if (recurrence?.frequency) {
					item = ScheduledTransaction.createInfinite(
						new StringValueObject("test"),
						startDate,
						new ItemRecurrenceFrequency(recurrence.frequency),
						fromSplits,
						finalToSplits,
						operation ?? ItemOperation.expense(),
						new TransactionCategory(
							Category.create(new CategoryName("Test")),
							SubCategory.create(
								CategoryID.generate(),
								new SubCategoryName("Test")
							)
						)
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

						item = ScheduledTransaction.createWithEndDate(
							new StringValueObject("test"),
							startDate,
							new ItemRecurrenceFrequency(recurrence.frequency),
							adjustedUntilDate,
							fromSplits,
							finalToSplits,
							operation ?? ItemOperation.expense(),
							new TransactionCategory(
								Category.create(new CategoryName("Test")),
								SubCategory.create(
									CategoryID.generate(),
									new SubCategoryName("Test")
								)
							)
						);
					}
				}

				return item;
			}
		);
	}

	return items;
};
