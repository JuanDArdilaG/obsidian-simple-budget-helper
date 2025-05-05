import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ERecurrenceState,
	Item,
	ItemDate,
	ItemID,
	ItemName,
	ItemPrice,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceModification,
	ItemRecurrenceModificationPrimitives,
	ItemRecurrenceUntilDate,
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
		startDate?: Date;
		untilDate?: Date;
	};
	recurrences?: Partial<ItemRecurrenceModificationPrimitives>[];
};

export const buildTestItems = (config: ItemConfig[] | number): Item[] => {
	let items: Item[] = [];
	if (typeof config === "number") {
		for (let i = 0; i < config; i++) {
			const itemID = ItemID.generate();
			items.push(
				new Item(
					itemID,
					ItemOperation.expense(),
					new ItemName("test"),
					new ItemPrice(100),
					CategoryID.generate(),
					SubCategoryID.generate(),
					AccountID.generate(),
					[
						new ItemRecurrenceModification(
							itemID,
							ItemDate.createNowDate(),
							ERecurrenceState.PENDING
						),
					],
					AccountID.generate()
				)
			);
		}
	} else {
		const itemID = ItemID.generate();
		items = config.map(
			({
				price,
				operation,
				recurrence,
				recurrences,
				account,
				toAccount,
			}) =>
				new Item(
					itemID,
					operation ?? ItemOperation.expense(),
					new ItemName("test"),
					price ?? new ItemPrice(100),
					CategoryID.generate(),
					SubCategoryID.generate(),
					account ?? AccountID.generate(),
					recurrences?.map((r) =>
						ItemRecurrenceModification.fromPrimitives({
							itemID: itemID.value,
							date: new Date(),
							state: ERecurrenceState.PENDING,
							...r,
						})
					) ?? [],
					toAccount ?? AccountID.generate(),
					recurrence &&
						new ItemRecurrence(
							itemID,
							recurrence.startDate
								? new DateValueObject(recurrence.startDate)
								: DateValueObject.createNowDate(),
							new ItemRecurrenceFrequency(
								recurrence.frequency ?? "1mo"
							),
							recurrence.untilDate
								? new ItemRecurrenceUntilDate(
										recurrence.untilDate
								  )
								: undefined
						)
				)
		);
	}

	return items;
};
