import { Transaction } from "contexts/Transactions/domain";
import { PropsWithChildren } from "react";
import { TransactionFormImproved } from "./TransactionFormImproved";

// TransactionForm component - wrapper for the improved version
export const TransactionForm = ({
	close,
	onSubmit,
	transaction,
	children,
}: PropsWithChildren<{
	close: () => void;
	onSubmit: (withClose: boolean) => void;
	transaction?: Transaction;
}>) => {
	return (
		<TransactionFormImproved
			close={close}
			onSubmit={onSubmit}
			transaction={transaction}
		>
			{children}
		</TransactionFormImproved>
	);
};
