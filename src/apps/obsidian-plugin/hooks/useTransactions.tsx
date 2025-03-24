import { Logger } from "contexts/Shared";
import { GetAllTransactionsGroupedByDaysUseCaseInput } from "contexts/Reports";
import { useState, useEffect, useContext } from "react";
import { TransactionsContext } from "apps/obsidian-plugin/views";
import { Transaction } from "contexts";
import { useLogger } from "./useLogger";

export const useTransactions = ({
	accountFilter,
	categoryFilter,
	subCategoryFilter,
}: GetAllTransactionsGroupedByDaysUseCaseInput) => {
	const logger = useLogger("useTransactions");
	const {
		useCases: { getAllTransactions },
	} = useContext(TransactionsContext);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [updateTransactions, setUpdateTransactions] = useState(true);

	useEffect(() => {
		setUpdateTransactions(true);
	}, [accountFilter, categoryFilter, subCategoryFilter]);

	useEffect(() => {
		if (updateTransactions) {
			setUpdateTransactions(false);
			getAllTransactions
				.execute({ accountFilter, categoryFilter, subCategoryFilter })
				.then((transactions) => {
					logger.debug("updating transactions", {
						accountFilter,
						categoryFilter,
						subCategoryFilter,
						transactions,
					});
					setTransactions(transactions);
				});
		}
	}, [updateTransactions]);

	return {
		transactions,
		updateTransactions: () => setUpdateTransactions(true),
	};
};
