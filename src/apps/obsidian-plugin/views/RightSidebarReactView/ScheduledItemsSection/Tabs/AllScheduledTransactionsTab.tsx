import { useState } from "react";
import { ScheduledTransaction } from "../../../../../../contexts/ScheduledTransactions/domain";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { AllScheduledTransactionsList } from "./AllScheduledTransactionsList";

export const AllScheduledTransactionsTab = () => {
	const [selectedScheduledTransaction, setSelectedScheduledTransaction] =
		useState<ScheduledTransaction>();
	const [action, setAction] = useState<"record">();

	return (
		<RightSidebarReactTab title="All Scheduled Transactions" subtitle>
			<AllScheduledTransactionsList
				action={action}
				setAction={setAction}
				selectedItem={selectedScheduledTransaction}
				setSelectedItem={setSelectedScheduledTransaction}
			/>
		</RightSidebarReactTab>
	);
};
