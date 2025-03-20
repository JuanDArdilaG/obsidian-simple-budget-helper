import { AccountingList } from "./AccountingList";
import { useState } from "react";
import {
	AccountingSectionButtons,
	SectionSelection,
} from "./AccountingSectionButtons";
import { AccountsList } from "./AccountsList";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";

export const AccountingSection = ({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("accounts");

	return (
		<RightSidebarReactTab title="Accounting">
			<AccountingSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>
			{sectionSelection === "movements" && (
				<AccountingList app={app} statusBarAddText={statusBarAddText} />
			)}
			{sectionSelection === "accounts" && <AccountsList />}
		</RightSidebarReactTab>
	);
};
