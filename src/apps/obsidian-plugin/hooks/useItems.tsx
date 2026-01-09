import { useEffect, useState } from "react";
import { GetAllScheduledTransactionsUseCase } from "../../../contexts/ScheduledTransactions/application/get-all-scheduled-transactions";
import { ScheduledTransaction } from "../../../contexts/ScheduledTransactions/domain";
import { useLogger } from "./useLogger";

export const useScheduledTransactions = ({
	getAllScheduledTransactionsUseCase,
}: {
	getAllScheduledTransactionsUseCase: GetAllScheduledTransactionsUseCase;
}) => {
	const { logger } = useLogger("useItems");

	const [items, setItems] = useState<ScheduledTransaction[]>([]);
	const [updateScheduledTransactions, setUpdateItems] = useState(true);

	useEffect(() => {
		if (updateScheduledTransactions) {
			setUpdateItems(false);
			getAllScheduledTransactionsUseCase
				.execute()
				.then((scheduledTransactions) => {
					logger.debug("updating scheduled items", {
						items: scheduledTransactions,
					});
					setItems(scheduledTransactions);
				});
		}
	}, [updateScheduledTransactions]);

	return {
		scheduledItems: items,
		updateScheduledTransactions: () => setUpdateItems(true),
	};
};
