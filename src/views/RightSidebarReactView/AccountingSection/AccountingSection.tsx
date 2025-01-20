import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget/Budget";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";
import { useState } from "react";
import {
	AccountingSectionButtons,
	SectionSelection,
} from "./AccountingSectionButtons";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { AccountsList } from "./AccountsList";

export const AccountingSection = ({
	budget,
	editModal,
	statusBarAddText,
}: {
	budget: Budget<BudgetItem>;
	editModal: EditBudgetItemRecordModalRoot;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("movements");

	return (
		<>
			<h1>Accounting</h1>

			<AccountingSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "movements" && (
				<AccountingList
					editModal={editModal}
					budget={budget}
					statusBarAddText={statusBarAddText}
				/>
			)}

			{sectionSelection === "accounts" && (
				<AccountsList budget={budget} />
			)}
		</>
	);
};
