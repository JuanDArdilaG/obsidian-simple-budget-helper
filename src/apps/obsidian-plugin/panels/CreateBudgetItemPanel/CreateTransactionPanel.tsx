import { useContext, useEffect, useState } from "react";
import { TransactionsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { Transaction } from "contexts/Transactions/domain";
import { CreateTransactionForm } from "./CreateTransactionForm";

export const CreateTransactionPanel = ({
	close,
	onCreate,
}: {
	close: () => void;
	onCreate: () => void;
}) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		useCases: { getAllUniqueTransactionsByNameUseCase },
	} = useContext(TransactionsContext);

	const [transactions, setTransactions] = useState<Transaction[]>([]);
	useEffect(() => {
		getAllUniqueTransactionsByNameUseCase
			.execute()
			.then(({ transactions }) => setTransactions(transactions));
	}, [getAllUniqueTransactionsByNameUseCase]);

	useEffect(() => {
		logger
			.title("unique items for creation")
			.obj({ items: transactions })
			.log();
	}, [transactions]);

	return (
		<CreateTransactionForm
			items={transactions}
			close={close}
			onCreate={onCreate}
		/>
	);
};
