import { NumberValueObject } from "@juandardilag/value-objects";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	ItemDate,
	ItemRecurrence,
	ItemRecurrenceFrequency,
	ItemRecurrenceUntilDate,
} from "contexts/Items/domain";
import { useContext, useState } from "react";
import { CreateItemForm } from "./CreateItemForm";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";

export const CreateItemPanel = ({ close }: { close: () => void }) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		scheduledItems,
		updateItems,
		useCases: { createScheduledItem: createItem },
	} = useContext(ItemsContext);

	const [showErrors, setShowErrors] = useState(false);

	const {
		RecurrenceForm,
		untilDate,
		recurrenceType,
		recurrences,
		frequencyString,
		isValid,
	} = useCreateRecurrenceForm({ showErrors });

	return (
		<CreateItemForm
			close={close}
			items={scheduledItems}
			isValid={isValid}
			showErrors={showErrors}
			onAttemptSubmit={() => setShowErrors(true)}
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
