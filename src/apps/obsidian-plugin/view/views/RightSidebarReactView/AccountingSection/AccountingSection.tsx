import { AccountingList } from "./AccountingList";
import { Budget } from "budget/Budget/Budget";
import { useState } from "react";
import {
	AccountingSectionButtons,
	SectionSelection,
} from "./AccountingSectionButtons";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { AccountsList } from "./AccountsList";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";

export const AccountingSection = ({
	app,
	budget,
	statusBarAddText,
}: {
	app: App;
	budget: Budget<BudgetItem>;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("movements");

	return (
		<RightSidebarReactTab title="Accounting">
			<AccountingSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>
			{sectionSelection === "movements" && (
				<AccountingList app={app} statusBarAddText={statusBarAddText} />
			)}
			{sectionSelection === "accounts" && (
				<AccountsList budget={budget} />
			)}
		</RightSidebarReactTab>
	);
};
