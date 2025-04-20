import { useState, useEffect } from "react";
import { useLogger } from "./useLogger";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { Transaction } from "contexts/Transactions/domain";
import { GetAllUniqueItemBrandsUseCase } from "contexts/Transactions/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { ItemBrand, ItemStore } from "contexts/Items/domain";

export const useTransactions = ({
	getAllTransactions,
	getAllUniqueItemBrands,
	getAllUniqueItemStores,
}: {
	getAllTransactions: GetAllTransactionsUseCase;
	getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
	getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
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

	const [brands, setBrands] = useState<ItemBrand[]>([]);
	const [updateBrands, setUpdateBrands] = useState(true);

	const [stores, setStores] = useState<ItemStore[]>([]);
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
		if (updateBrands) {
			setUpdateBrands(false);
			getAllUniqueItemBrands.execute().then((brands) => {
				logger.debug("updating brands", {
					brands,
				});
				setBrands(brands);
			});
		}
	}, [updateBrands]);

	useEffect(() => {
		if (updateStores) {
			setUpdateStores(false);
			getAllUniqueItemStores.execute().then((stores) => {
				logger.debug("updating stores", {
					updateStores,
					brands,
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
		brands,
		updateBrands: () => setUpdateBrands(true),
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
