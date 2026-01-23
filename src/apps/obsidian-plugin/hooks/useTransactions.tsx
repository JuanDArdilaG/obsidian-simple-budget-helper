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
		if (updateTransactions) {
			setIsLoading(true);
			getAllTransactions.execute({}).then((transactions) => {
				logger.debug("updating transactions", {
					transactions: transactions.map((t) => t.toPrimitives()),
				});
				setTransactions(transactions);
				setIsLoading(false);
			});
		}
	}, [updateTransactions]);

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
		isLoading,
		transactions,
		updateTransactions: () => {
			setUpdateTransactions(true);
		},
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
