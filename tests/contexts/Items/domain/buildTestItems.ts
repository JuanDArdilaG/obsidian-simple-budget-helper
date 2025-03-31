import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ScheduledItem,
	ScheduledItemDate,
	ScheduledItemRecurrence,
	ScheduledItemFrequency,
	ScheduledItemUntilDate,
} from "contexts/ScheduledItems/domain";
import { ItemOperation } from "contexts/Shared/domain";
import {
	SimpleItem,
	ItemID,
	ItemName,
	ItemPrice,
} from "contexts/SimpleItems/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";

type ScheduledItemConfig = {
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

export const buildTestItems = ({
	scheduled,
	simple,
}: {
	scheduled?: ScheduledItemConfig[] | number;
	simple?: number;
}): { scheduled: ScheduledItem[]; simple: SimpleItem[] } => {
	let scheduledItems: ScheduledItem[] = [];
	if (scheduled)
		if (typeof scheduled === "number") {
			for (let i = 0; i < scheduled; i++) {
				scheduledItems.push(
					new ScheduledItem(
						ItemID.generate(),
						ItemOperation.transfer(),
						new ItemName("test"),
						new ItemPrice(100),
						CategoryID.generate(),
						SubCategoryID.generate(),
						AccountID.generate(),
						ScheduledItemDate.createNowDate(),
						undefined,
						undefined,
						undefined,
						AccountID.generate()
					)
				);
			}
		} else {
			const itemID = ItemID.generate();
			scheduledItems = scheduled.map(
				({ price, date, recurrence, account, toAccount }) =>
					new ScheduledItem(
						itemID,
						ItemOperation.transfer(),
						new ItemName("test"),
						price ?? new ItemPrice(100),
						CategoryID.generate(),
						SubCategoryID.generate(),
						account ?? AccountID.generate(),
						date
							? new ScheduledItemDate(date)
							: ScheduledItemDate.createNowDate(),
						recurrence
							? new ScheduledItemRecurrence(
									itemID,
									recurrence.startDate
										? new DateValueObject(
												recurrence.startDate
										  )
										: DateValueObject.createNowDate(),
									new ScheduledItemFrequency(
										recurrence.frequency ?? "1mo"
									),
									undefined,
									recurrence.untilDate
										? new ScheduledItemUntilDate(
												recurrence.untilDate
										  )
										: undefined
							  )
							: undefined,
						undefined,
						undefined,
						toAccount ?? AccountID.generate()
					)
			);
		}

	return { scheduled: scheduledItems, simple: [] };
};
