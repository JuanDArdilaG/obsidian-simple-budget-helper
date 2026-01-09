import { ScheduledTransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useContext, useEffect, useState } from "react";
import { ScheduledTransaction } from "../../../../../../contexts/ScheduledTransactions/domain";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { AllScheduledTransactionsList } from "./AllScheduledTransactionsList";

export const AllScheduledTransactionsTab = () => {
	const { scheduledItems, updateScheduledTransactions } = useContext(
		ScheduledTransactionsContext
	);
	const [selectedScheduledTransaction, setSelectedScheduledTransaction] =
		useState<ScheduledTransaction>();
	const [action, setAction] = useState<"record">();

	useEffect(() => {
		updateScheduledTransactions();
	}, []);

	return (
		<RightSidebarReactTab title="All Scheduled Transactions" subtitle>
			<AllScheduledTransactionsList
				scheduledTransactions={scheduledItems}
				action={action}
				setAction={setAction}
				updateItems={updateScheduledTransactions}
				selectedItem={selectedScheduledTransaction}
				setSelectedItem={setSelectedScheduledTransaction}
			/>
		</RightSidebarReactTab>
	);
};
