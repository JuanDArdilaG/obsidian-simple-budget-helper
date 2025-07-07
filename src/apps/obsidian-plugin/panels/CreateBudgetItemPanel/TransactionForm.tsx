import { Item } from "contexts/Items/domain";
import { Transaction } from "contexts/Transactions/domain";
import { PropsWithChildren } from "react";
import { TransactionFormImproved } from "./TransactionFormImproved";

// TransactionForm component - wrapper for the improved version
export const TransactionForm = ({
	items,
	close,
	onSubmit,
	transaction,
	children,
}: PropsWithChildren<{
	items: Item[];
	close: () => void;
	onSubmit: () => void;
	transaction?: Transaction;
}>) => {
	return (
		<TransactionFormImproved
			items={items}
			close={close}
			onSubmit={onSubmit}
			transaction={transaction}
		>
			{children}
		</TransactionFormImproved>
	);
};
