import { AccountingList } from "./AccountingList";
import { useEffect, useState } from "react";
import {
	AccountingSectionButtons,
	AccountingSectionSelection,
} from "./AccountingSectionButtons";
import { AccountsList } from "./AccountsList";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";

export const AccountingSection = ({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const logger = useLogger("AccountingSection");
	const [sectionSelection, setSectionSelection] =
		useState<AccountingSectionSelection>("movements");

	useEffect(() => {
		logger.debug(
			"section selection changed",
			{ sectionSelection },
			{ on: false }
		);
	}, [sectionSelection]);

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
