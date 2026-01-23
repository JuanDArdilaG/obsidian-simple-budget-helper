import { useState } from "react";
import { ScheduledTransaction } from "../../../../../../contexts/ScheduledTransactions/domain";
import { AllScheduledTransactionsList } from "./AllScheduledTransactionsList";

export const AllScheduledTransactionsTab = () => {
	const [selectedScheduledTransaction, setSelectedScheduledTransaction] =
		useState<ScheduledTransaction>();
	const [action, setAction] = useState<"record">();

	return (
		<AllScheduledTransactionsList
			action={action}
			setAction={setAction}
			selectedTransaction={selectedScheduledTransaction}
			setSelectedTransaction={setSelectedScheduledTransaction}
		/>
	);
};
