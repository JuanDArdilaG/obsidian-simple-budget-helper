import { useContext } from "react";
import {
	ItemDate,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceUntilDate,
} from "contexts/Items/domain";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateItemForm } from "./CreateItemForm";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";
import { NumberValueObject } from "@juandardilag/value-objects";

export const CreateItemPanel = ({ close }: { close: () => void }) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		scheduledItems,
		updateItems,
		useCases: { createItem },
	} = useContext(ItemsContext);

	const {
		RecurrenceForm,
		untilDate,
		recurrenceType,
		recurrences,
		frequencyString,
	} = useCreateRecurrenceForm({});

	return (
		<CreateItemForm
			close={close}
			items={scheduledItems}
			onSubmit={async (item, date) => {
				if (untilDate)
					item.updateRecurrence(
						ItemRecurrence.untilDate(
							(date && new ItemDate(date?.value)) ||
								ItemDate.createNowDate(),
							new ItemRecurrenceFrequency(frequencyString),
							new ItemRecurrenceUntilDate(untilDate)
						)
					);
				if (!untilDate)
					if (recurrenceType === "oneTime")
						item.updateRecurrence(
							ItemRecurrence.oneTime(
								(date && new ItemDate(date?.value)) ||
									ItemDate.createNowDate()
							)
						);
					else if (recurrenceType === "infinite")
						item.updateRecurrence(
							ItemRecurrence.infinite(
								(date && new ItemDate(date?.value)) ||
									ItemDate.createNowDate(),
								new ItemRecurrenceFrequency(frequencyString)
							)
						);
					else
						item.updateRecurrence(
							ItemRecurrence.untilNRecurrences(
								(date && new ItemDate(date?.value)) ||
									ItemDate.createNowDate(),
								new ItemRecurrenceFrequency(frequencyString),
								new NumberValueObject(recurrences)
							)
						);
				logger
					.debugB("creating scheduled item", {
						date,
						recurrences,
						item,
						frequencyString,
					})
					.log();
				await createItem.execute(item);
				updateItems();
			}}
		>
			{RecurrenceForm}
		</CreateItemForm>
	);
};
