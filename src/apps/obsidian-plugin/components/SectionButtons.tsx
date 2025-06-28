import {
	CalendarSync,
	Landmark,
	ListCollapse,
	Package,
	Settings,
} from "lucide-react";
import { JSX } from "react";
import { Button } from "./Button";

export type MainSidebarSections =
	| "scheduledItems"
	| "accounting"
	| "accounts"
	| "categories"
	| "items"
	| "localPersistence";

export const SectionButtons = ({
	selected,
	setSelected,
}: {
	selected: MainSidebarSections;
	setSelected: (selected: MainSidebarSections) => void;
}) => {
	// Debug logging for mobile issues
	console.log("SectionButtons render:", {
		selected,
		isMobile:
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			),
	});

	const handleSectionClick = (section: MainSidebarSections) => {
		console.log("Section button clicked:", section);
		setSelected(section);
	};

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
				onClick={() => handleSectionClick("accounting")}
			/>
			<SectionButton
				type="items"
				label="Items"
				icon={
					<Package size={16} style={{ color: "var(--color-cyan)" }} />
				}
				selected={selected}
				onClick={() => handleSectionClick("items")}
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
				onClick={() => handleSectionClick("scheduledItems")}
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
				onClick={() => handleSectionClick("accounts")}
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
				onClick={() => handleSectionClick("categories")}
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
				onClick={() => handleSectionClick("localPersistence")}
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
