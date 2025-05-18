import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ERecurrenceState,
	Item,
	ItemDate,
	ItemName,
	ItemPrice,
	ItemRecurrenceFrequency,
	ItemRecurrenceInfo,
	ItemRecurrenceInfoPrimitives,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";

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
	modifications?: Partial<ItemRecurrenceInfoPrimitives>[];
};

export const buildTestItems = (config: ItemConfig[] | number): Item[] => {
	let items: Item[] = [];
	if (typeof config === "number") {
		for (let i = 0; i < config; i++) {
			const item = Item.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("test"),
				new ItemPrice(100),
				ItemOperation.expense(AccountID.generate()),
				CategoryID.generate(),
				SubCategoryID.generate()
			);
			item.recurrence.updateRecurrences([
				new ItemRecurrenceInfo(
					ItemDate.createNowDate(),
					ERecurrenceState.PENDING
				),
			]);
			items.push(item);
		}
	} else {
		items = config.map(
			({
				price,
				operation,
				recurrence,
				modifications,
				account,
				toAccount,
			}) => {
				const startDate =
					recurrence?.startDate ?? DateValueObject.createNowDate();
				let item = Item.oneTime(
					startDate,
					new ItemName("test"),
					price ?? new ItemPrice(100),
					operation ??
						ItemOperation.expense(account ?? AccountID.generate()),
					CategoryID.generate(),
					SubCategoryID.generate()
				);
				if (recurrence?.frequency) {
					item = Item.infinite(
						startDate,
						new ItemName("test"),
						price ?? new ItemPrice(100),
						operation ??
							ItemOperation.expense(
								account ?? AccountID.generate()
							),
						CategoryID.generate(),
						SubCategoryID.generate(),
						new ItemRecurrenceFrequency(recurrence.frequency)
					);
					if (recurrence.untilDate) {
						item = Item.untilDate(
							new ItemName("test"),
							price ?? new ItemPrice(100),
							operation ??
								ItemOperation.expense(
									account ?? AccountID.generate()
								),
							CategoryID.generate(),
							SubCategoryID.generate(),
							new ItemRecurrenceFrequency(recurrence.frequency),
							startDate,
							recurrence.untilDate
						);
					}
				}

				if (modifications)
					item.recurrence.updateRecurrences(
						modifications.map((r) =>
							ItemRecurrenceInfo.fromPrimitives({
								date: new Date(),
								state: ERecurrenceState.PENDING,
								...r,
							})
						)
					);

				return item;
			}
		);
	}

	return items;
};
