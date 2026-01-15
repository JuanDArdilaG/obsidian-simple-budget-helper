import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useContext, useState } from "react";
import {
	ItemRecurrenceFrequency,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../contexts/ScheduledTransactions/domain";
import { CreateScheduleTransactionForm } from "./CreateScheduleTransactionForm";
import { useCreateRecurrenceForm } from "./useCreateRecurrenceForm";

export const CreateScheduledTransactionPanel = ({
	close,
}: {
	close: () => void;
}) => {
	const { logger } = useLogger("CreateScheduledTransactionPanel");
	const {
		scheduledItems,
		updateScheduledTransactions: updateItems,
		useCases: { createScheduledItem: createItem },
	} = useContext(ScheduledTransactionsContext);

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
		<CreateScheduleTransactionForm
			close={close}
			items={scheduledItems}
			isValid={isValid}
			showErrors={showErrors}
			onAttemptSubmit={() => setShowErrors(true)}
			onSubmit={async (baseScheduledTransaction, date) => {
				let scheduledTransaction: ScheduledTransaction;
				const startDate =
					(date && new ScheduledTransactionDate(date?.value)) ||
					ScheduledTransactionDate.createNowDate();
				if (untilDate) {
					scheduledTransaction =
						ScheduledTransaction.createWithEndDate(
							baseScheduledTransaction.name,
							startDate,
							new ItemRecurrenceFrequency(frequencyString),
							new DateValueObject(untilDate),
							baseScheduledTransaction.originAccounts,
							baseScheduledTransaction.destinationAccounts,
							baseScheduledTransaction.operation,
							baseScheduledTransaction.category,
							baseScheduledTransaction.store
						);
					if (baseScheduledTransaction.tags)
						scheduledTransaction.updateTags(
							baseScheduledTransaction.tags
						);
				} else {
					if (recurrenceType === "oneTime") {
						scheduledTransaction =
							ScheduledTransaction.createOneTime(
								baseScheduledTransaction.name,
								startDate,
								baseScheduledTransaction.originAccounts,
								baseScheduledTransaction.destinationAccounts,
								baseScheduledTransaction.operation,
								baseScheduledTransaction.category,
								baseScheduledTransaction.store
							);
						if (baseScheduledTransaction.tags)
							scheduledTransaction.updateTags(
								baseScheduledTransaction.tags
							);
					} else if (recurrenceType === "infinite") {
						scheduledTransaction =
							ScheduledTransaction.createInfinite(
								baseScheduledTransaction.name,
								startDate,
								new ItemRecurrenceFrequency(frequencyString),
								baseScheduledTransaction.originAccounts,
								baseScheduledTransaction.destinationAccounts,
								baseScheduledTransaction.operation,
								baseScheduledTransaction.category,
								baseScheduledTransaction.store
							);
						if (baseScheduledTransaction.tags)
							scheduledTransaction.updateTags(
								baseScheduledTransaction.tags
							);
					} else {
						scheduledTransaction =
							ScheduledTransaction.createWithMaxOccurrences(
								baseScheduledTransaction.name,
								startDate,
								new ItemRecurrenceFrequency(frequencyString),
								new NumberValueObject(recurrences),
								baseScheduledTransaction.originAccounts,
								baseScheduledTransaction.destinationAccounts,
								baseScheduledTransaction.operation,
								baseScheduledTransaction.category,
								baseScheduledTransaction.store
							);
						if (baseScheduledTransaction.tags)
							scheduledTransaction.updateTags(
								baseScheduledTransaction.tags
							);
					}
				}
				logger
					.debugB("creating scheduled item", {
						date,
						recurrences,
						scheduledTransaction,
						frequencyString,
					})
					.log();
				await createItem.execute(scheduledTransaction);
				updateItems();
			}}
		>
			{RecurrenceForm}
		</CreateScheduleTransactionForm>
	);
};
