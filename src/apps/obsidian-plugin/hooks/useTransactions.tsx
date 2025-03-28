import { useState, useEffect } from "react";
import {
	AccountID,
	CategoryID,
	GetAllTransactionsUseCase,
	SubCategoryID,
	Transaction,
} from "contexts";
import { useLogger } from "./useLogger";

export const useTransactions = ({
	getAllTransactions,
}: {
	getAllTransactions: GetAllTransactionsUseCase;
}) => {
	const logger = useLogger("useTransactions", false);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [filteredTransactions, setFilteredTransactions] = useState<
		Transaction[]
	>([]);
	const [updateTransactions, setUpdateTransactions] = useState(true);
	const [filters, setFilters] = useState<
		[
			account?: AccountID,
			category?: CategoryID,
			subCategory?: SubCategoryID
		]
	>([undefined, undefined, undefined]);
	const [updateFilteredTransactions, setUpdateFilteredTransactions] =
		useState(true);

	useEffect(() => {
		if (updateTransactions) {
			setUpdateFilteredTransactions(false);
			getAllTransactions.execute({}).then((transactions) => {
				logger.debug("updating transactions", {
					transactions: transactions.map((t) => t.toPrimitives()),
				});
				setTransactions(transactions);
			});
		}
	}, [updateTransactions]);

	useEffect(() => {
		getAllTransactions
			.execute({
				accountFilter: filters[0],
				categoryFilter: filters[1],
				subCategoryFilter: filters[2],
			})
			.then((transactions) => {
				logger.debug("updating filtered transactions", {
					filters,
					transactions: transactions.map((t) => t.toPrimitives()),
				});
				setFilteredTransactions(transactions);
			});
	}, [filters]);

	useEffect(() => {
		if (updateTransactions) {
			setUpdateFilteredTransactions(false);
			getAllTransactions
				.execute({
					accountFilter: filters[0],
					categoryFilter: filters[1],
					subCategoryFilter: filters[2],
				})
				.then((transactions) => {
					logger.debug("updating filtered transactions", {
						filters,
						transactions: transactions.map((t) => t.toPrimitives()),
					});
					setFilteredTransactions(transactions);
				});
		}
	}, [updateFilteredTransactions]);

	return {
		transactions,
		filteredTransactions,
		setFilters,
		updateTransactions: () => {
			setUpdateTransactions(true);
			setUpdateFilteredTransactions(true);
		},
		updateFilteredTransactions: () => setUpdateFilteredTransactions(true),
	};
};
