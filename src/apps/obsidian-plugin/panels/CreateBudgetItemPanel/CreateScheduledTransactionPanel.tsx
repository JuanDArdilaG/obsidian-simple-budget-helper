import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useContext, useState } from "react";
import {
	RecurrencePattern,
	ScheduledTransaction,
} from "../../../../contexts/ScheduledTransactions/domain";
import { RecurrencePatternFormV2 } from "../../components/v2/RecurrencePatternFormV2";
import { CreateScheduleTransactionForm } from "./CreateScheduleTransactionForm";

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

	const [recurrenceIsValid, setRecurrenceIsValid] = useState(false);
	const [recurrence, setRecurrence] = useState<RecurrencePattern>();

	return (
		<CreateScheduleTransactionForm
			close={close}
			items={scheduledItems}
			isValid={recurrenceIsValid}
			showErrors={showErrors}
			onAttemptSubmit={() => setShowErrors(true)}
			onSubmit={async (baseScheduledTransaction) => {
				if (!recurrence) {
					logger.debug("Recurrence pattern is undefined on submit");
					throw new Error("Recurrence pattern is undefined");
				}
				const scheduledTransaction = ScheduledTransaction.create(
					baseScheduledTransaction.name,
					recurrence,
					baseScheduledTransaction.originAccounts,
					baseScheduledTransaction.destinationAccounts,
					baseScheduledTransaction.operation,
					baseScheduledTransaction.category,
					baseScheduledTransaction.store
				);
				baseScheduledTransaction.tags &&
					scheduledTransaction.updateTags(
						baseScheduledTransaction.tags
					);
				logger.debug("creating scheduled item", {
					recurrence,
					scheduledTransaction,
				});
				await createItem.execute(scheduledTransaction);
				updateItems();
			}}
		>
			<RecurrencePatternFormV2
				onValidationChange={(isValid) => setRecurrenceIsValid(isValid)}
				onChange={setRecurrence}
			/>
		</CreateScheduleTransactionForm>
	);
};
