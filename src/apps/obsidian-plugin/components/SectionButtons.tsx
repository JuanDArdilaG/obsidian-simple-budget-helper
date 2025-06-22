import { CalendarSync, Landmark, ListCollapse, Settings } from "lucide-react";
import { JSX } from "react";
import { Button } from "./Button";

export type MainSidebarSections =
	| "scheduledItems"
	| "accounting"
	| "accounts"
	| "categories"
	| "localPersistence";

export const SectionButtons = ({
	selected,
	setSelected,
}: {
	selected: MainSidebarSections;
	setSelected: (selected: MainSidebarSections) => void;
}) => {
	return (
		<div className="section-buttons">
			<SectionButton
				type="accounting"
				label="Accounting"
				icon={
					<ListCollapse
						size={16}
						style={{ color: "var(--color-cyan)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("accounting")}
			/>
			<SectionButton
				type="scheduledItems"
				label="Scheduled"
				icon={
					<CalendarSync
						size={16}
						style={{ color: "var(--color-cyan)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("scheduledItems")}
			/>
			<SectionButton
				type="accounts"
				label="Accounts"
				icon={
					<Landmark
						size={16}
						style={{ color: "var(--color-cyan)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("accounts")}
			/>
			<SectionButton
				type="categories"
				label="Categories"
				icon={
					<Landmark
						size={16}
						style={{ color: "var(--color-cyan)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("categories")}
			/>
			<SectionButton
				type="localPersistence"
				label="Settings"
				icon={
					<Settings
						size={16}
						style={{ color: "var(--color-cyan)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("localPersistence")}
			/>
		</div>
	);
};

export const SectionButton = ({
	label,
	icon,
	type,
	selected,
	onClick,
}: {
	label: string;
	icon?: JSX.Element;
	type: string;
	selected?: string;
	onClick: () => void;
}) => {
	return (
		<Button
			label={label}
			icon={icon}
			onClick={async () => onClick()}
			disabled={selected === type}
		/>
	);
};
