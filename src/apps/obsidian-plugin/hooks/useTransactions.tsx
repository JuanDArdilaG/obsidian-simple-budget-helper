import { StringValueObject } from "@juandardilag/value-objects";
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
	const [isLoading, setIsLoading] = useState(false);

	const [updateTransactions, setUpdateTransactions] = useState(true);

	const [stores, setStores] = useState<StringValueObject[]>([]);
	const [updateStores, setUpdateStores] = useState(true);

	useEffect(() => {
		console.log("[useTransactions] Effect triggered", {
			updateTransactions,
			transactionCount: transactions.length,
		});
		if (updateTransactions) {
			console.log("[useTransactions] Starting transaction fetch");
			setUpdateTransactions(false);
			setIsLoading(true);
			getAllTransactions
				.execute()
				.then((newTransactions) => {
					console.log("[useTransactions] Transactions fetched", {
						count: newTransactions.length,
					});
					logger.debug("updating transactions", {
						transactions: newTransactions.map((t) =>
							t.toPrimitives(),
						),
					});
					setTransactions(newTransactions);
					setIsLoading(false);
					console.log(
						"[useTransactions] Transaction update complete",
					);
				})
				.catch((error) => {
					console.error(
						"[useTransactions] Error fetching transactions:",
						error,
					);
					setIsLoading(false);
				});
		}
	}, [updateTransactions]);

	useEffect(() => {
		console.log("[useTransactions] Stores effect triggered", {
			updateStores,
			storeCount: stores.length,
		});
		if (updateStores) {
			console.log("[useTransactions] Starting stores fetch");
			setUpdateStores(false);
			getAllUniqueItemStores
				.execute()
				.then((newStores) => {
					console.log("[useTransactions] Stores fetched", {
						count: newStores.length,
					});
					logger.debug("updating stores", {
						updateStores,
					});
					setStores(newStores);
				})
				.catch((error) => {
					console.error(
						"[useTransactions] Error fetching stores:",
						error,
					);
				});
		}
	}, [updateStores]);

	return {
		isLoading,
		transactions,
		updateTransactions: () => {
			setUpdateTransactions(true);
		},
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
