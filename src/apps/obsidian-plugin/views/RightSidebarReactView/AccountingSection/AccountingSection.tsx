import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { TransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/TransactionPanel";
import { Transaction } from "contexts/Transactions/domain";
import { useContext, useEffect, useState } from "react";
import { TransactionsContext } from "../Contexts";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AccountingList } from "./AccountingList";
import { AccountingSectionSelection } from "./AccountingSectionButtons";

export const AccountingSection = ({
	statusBarAddText,
}: {
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const { updateFilteredTransactions } = useContext(TransactionsContext);
	const logger = useLogger("AccountingSection");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [sectionSelection] =
		useState<AccountingSectionSelection>("movements");

	useEffect(() => {
		logger.debug("section selection changed", { sectionSelection });
	}, [sectionSelection]);

	const [selection, setSelection] = useState<Transaction[]>([]);

	const handleCloseForm = () => {
		setShowCreateForm(false);
		setEditingTransaction(null);
	};

	const handleCreate = () => {
		setEditingTransaction(null);
		setShowCreateForm(!showCreateForm);
	};

	const handleEdit = (transaction: Transaction) => {
		setEditingTransaction(transaction);
		setShowCreateForm(true);
	};

	const handleFormSubmit = (shouldClose: boolean = true) => {
		setSelection([]);
		if (shouldClose) {
			handleCloseForm();
		}
	};

	return (
		<RightSidebarReactTab
			title="Accounting"
			handleCreate={async () => handleCreate()}
			handleRefresh={async () => updateFilteredTransactions()}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<TransactionPanel
					close={handleCloseForm}
					onCreate={handleFormSubmit}
					transaction={editingTransaction}
				/>
			)}
			{sectionSelection === "movements" && (
				<AccountingList
					statusBarAddText={statusBarAddText}
					selection={selection}
					setSelection={setSelection}
					onEditTransaction={handleEdit}
				/>
			)}
		</RightSidebarReactTab>
	);
};
