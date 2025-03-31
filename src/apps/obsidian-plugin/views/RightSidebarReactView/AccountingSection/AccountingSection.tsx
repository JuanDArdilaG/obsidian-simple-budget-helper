import { useEffect, useState } from "react";
import { AccountingList } from "./AccountingList";
import {
	AccountingSectionButtons,
	AccountingSectionSelection,
} from "./AccountingSectionButtons";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";
import { CreateItemPanel } from "apps/obsidian-plugin/panels";

export const AccountingSection = ({
	app,
	statusBarAddText,
}: {
	app: App;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const logger = useLogger("AccountingSection");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [sectionSelection, setSectionSelection] =
		useState<AccountingSectionSelection>("movements");

	useEffect(() => {
		logger.debug("section selection changed", { sectionSelection });
	}, [sectionSelection]);

	return (
		<RightSidebarReactTab title="Accounting">
			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateItemPanel close={() => setShowCreateForm(false)} />
			)}
			<AccountingSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>
			{sectionSelection === "movements" && (
				<AccountingList app={app} statusBarAddText={statusBarAddText} />
			)}
		</RightSidebarReactTab>
	);
};
