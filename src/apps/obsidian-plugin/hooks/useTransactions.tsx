import { StringValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import { Nanoid } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { Transaction } from "contexts/Transactions/domain";
import { useEffect, useState } from "react";
import { useLogger } from "./useLogger";

export const useTransactions = ({
	getAllTransactions,
	getAllUniqueItemStores,
}: {
	getAllTransactions: GetAllTransactionsUseCase;
	getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
}) => {
	const { logger } = useLogger("useTransactions");

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [filteredTransactions, setFilteredTransactions] = useState<
		Transaction[]
	>([]);
	const [updateTransactions, setUpdateTransactions] = useState(true);
	const [filters, setFilters] = useState<
		[account?: Nanoid, category?: CategoryID, subCategory?: SubCategoryID]
	>([undefined, undefined, undefined]);
	const [updateFilteredTransactions, setUpdateFilteredTransactions] =
		useState(true);

	const [stores, setStores] = useState<StringValueObject[]>([]);
	const [updateStores, setUpdateStores] = useState(true);

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

	useEffect(() => {
		if (updateStores) {
			setUpdateStores(false);
			getAllUniqueItemStores.execute().then((stores) => {
				logger.debug("updating stores", {
					updateStores,
				});
				setStores(stores);
			});
		}
	}, [updateStores]);

	return {
		transactions,
		updateTransactions: () => {
			setUpdateTransactions(true);
			setUpdateFilteredTransactions(true);
		},
		filteredTransactions,
		setFilters,
		updateFilteredTransactions: () => setUpdateFilteredTransactions(true),
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
