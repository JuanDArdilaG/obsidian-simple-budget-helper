import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionForm } from "./TransactionForm";

export const TransactionPanel = ({
	close,
	onCreate,
	transaction,
}: {
	close: () => void;
	onCreate: (withClose: boolean) => void;
	transaction?: Transaction | null;
}) => {
	const { logger } = useLogger("CreateItemPanel");

	return (
		<TransactionForm
			close={close}
			onSubmit={onCreate}
			transaction={transaction || undefined}
		/>
	);
};
