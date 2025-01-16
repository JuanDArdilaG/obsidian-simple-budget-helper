import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget/Budget";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";

export const AccountingSection = ({
	budget,
	editModal,
}: {
	budget: Budget;
	editModal: EditBudgetItemRecordModalRoot;
}) => {
	return (
		<>
			<h1>Accounting</h1>
			<AccountingList editModal={editModal} budget={budget} />
		</>
	);
};
