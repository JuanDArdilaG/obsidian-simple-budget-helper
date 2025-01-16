import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget/Budget";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";

export const AccountingSection = ({
	budget,
	editModal,
	statusBarAddText,
}: {
	budget: Budget;
	editModal: EditBudgetItemRecordModalRoot;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	return (
		<>
			<h1>Accounting</h1>
			<AccountingList
				editModal={editModal}
				budget={budget}
				statusBarAddText={statusBarAddText}
			/>
		</>
	);
};
