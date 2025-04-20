import { useContext, useEffect, useState } from "react";
import { AccountingList } from "./AccountingList";
import { AccountingSectionSelection } from "./AccountingSectionButtons";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/CreateTransactionPanel";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionsContext } from "../Contexts";

export const AccountingSection = ({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const { updateFilteredTransactions } = useContext(TransactionsContext);
	const logger = useLogger("AccountingSection");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [sectionSelection] =
		useState<AccountingSectionSelection>("movements");

	useEffect(() => {
		logger.debug("section selection changed", { sectionSelection });
	}, [sectionSelection]);

	const [selection, setSelection] = useState<Transaction[]>([]);

	return (
		<RightSidebarReactTab
			title="Accounting"
			handleCreate={async () => setShowCreateForm(!showCreateForm)}
			handleRefresh={async () => {
				updateFilteredTransactions();
			}}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<CreateTransactionPanel
					close={() => setShowCreateForm(false)}
					onCreate={() => setSelection([])}
				/>
			)}
			{sectionSelection === "movements" && (
				<AccountingList
					app={app}
					statusBarAddText={statusBarAddText}
					selection={selection}
					setSelection={setSelection}
				/>
			)}
		</RightSidebarReactTab>
	);
};
