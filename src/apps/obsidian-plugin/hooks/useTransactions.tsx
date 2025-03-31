import { useState, useEffect } from "react";
import { useLogger } from "./useLogger";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { Transaction } from "contexts/Transactions/domain";

export const useTransactions = ({
	getAllTransactions,
}: {
	getAllTransactions: GetAllTransactionsUseCase;
}) => {
	const { logger } = useLogger("useTransactions");

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
