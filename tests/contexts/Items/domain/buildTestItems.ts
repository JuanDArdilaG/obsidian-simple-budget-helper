import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	Item,
	ItemDate,
	ItemID,
	ItemName,
	ItemPrice,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceUntilDate,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";

type ItemConfig = {
	price?: ItemPrice;
	date?: Date;
	account?: AccountID;
	toAccount?: AccountID;
	recurrence?: {
		frequency?: string;
		startDate?: Date;
		untilDate?: Date;
	};
};

export const buildTestItems = (config: ItemConfig[] | number): Item[] => {
	let items: Item[] = [];
	if (typeof config === "number") {
		for (let i = 0; i < config; i++) {
			items.push(
				new Item(
					ItemID.generate(),
					ItemOperation.transfer(),
					new ItemName("test"),
					new ItemPrice(100),
					CategoryID.generate(),
					SubCategoryID.generate(),
					AccountID.generate(),
					ItemDate.createNowDate(),
					AccountID.generate()
				)
			);
		}
	} else {
		const itemID = ItemID.generate();
		items = config.map(
			({ price, date, recurrence, account, toAccount }) =>
				new Item(
					itemID,
					ItemOperation.transfer(),
					new ItemName("test"),
					price ?? new ItemPrice(100),
					CategoryID.generate(),
					SubCategoryID.generate(),
					account ?? AccountID.generate(),
					date ? new ItemDate(date) : ItemDate.createNowDate(),
					toAccount ?? AccountID.generate(),
					recurrence
						? new ItemRecurrence(
								itemID,
								recurrence.startDate
									? new DateValueObject(recurrence.startDate)
									: DateValueObject.createNowDate(),
								new ItemRecurrenceFrequency(
									recurrence.frequency ?? "1mo"
								),
								undefined,
								recurrence.untilDate
									? new ItemRecurrenceUntilDate(
											recurrence.untilDate
									  )
									: undefined
						  )
						: undefined
				)
		);
	}

	return items;
};
