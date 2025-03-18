import { CalendarClock, List, Logs } from "lucide-react";
import { JSX } from "react";

export type SectionSelection = "calendar" | "list" | "perCategory";

export const RecurrentItemsSectionButtons = ({
	selected,
	setSelected,
}: {
	selected: SectionSelection;
	setSelected: (selected: SectionSelection) => void;
}) => {
	return (
		<>
			<div className="section-buttons">
				<SectionButton
					type="calendar"
					label="Upcoming"
					icon={<CalendarClock size={16} />}
					selected={selected}
					onClick={() => setSelected("calendar")}
				/>
				<SectionButton
					type="list"
					label="All"
					icon={<List size={16} />}
					selected={selected}
					onClick={() => setSelected("list")}
				/>
				<SectionButton
					label="Per Category"
					type="perCategory"
					icon={<Logs size={16} />}
					selected={selected}
					onClick={() => setSelected("perCategory")}
				/>
			</div>
		</>
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
