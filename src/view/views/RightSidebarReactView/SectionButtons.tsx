import { CalendarSync, ListCollapse, Menu } from "lucide-react";
import { JSX } from "react";

export type SidebarSections = "recurrentItems" | "accounting";

export const SectionButtons = ({
	selected,
	setSelected,
}: {
	selected: SidebarSections;
	setSelected: (selected: SidebarSections) => void;
}) => {
	return (
		<div className="section-buttons-container">
			<div className="section-buttons">
				<SectionButton
					type="accounting"
					label="Accounting"
					icon={<ListCollapse size={16} />}
					selected={selected}
					onClick={() => setSelected("accounting")}
				/>
				<SectionButton
					type="recurrentItems"
					label="Recurrent"
					icon={<CalendarSync size={16} />}
					selected={selected}
					onClick={() => setSelected("recurrentItems")}
				/>
			</div>
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
	selected: string;
	onClick?: () => void;
}) => {
	return (
		<button
			className={selected === type ? "active-section-button" : ""}
			onClick={onClick}
			disabled={selected === type}
		>
			{icon}
			{!icon || selected === type ? " " + label : ""}
		</button>
	);
};
