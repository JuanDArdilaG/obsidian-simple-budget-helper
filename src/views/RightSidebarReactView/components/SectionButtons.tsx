import { RefreshCcw } from "lucide-react";

export type SectionSelection = "calendar" | "list" | "perCategory";

export const SectionButtons = ({
	selected,
	setSelected,
	refresh,
}: {
	selected: SectionSelection;
	setSelected: (selected: SectionSelection) => void;
	refresh: () => void;
}) => {
	return (
		<>
			<button style={{ float: "left" }} onClick={refresh}>
				<RefreshCcw size={16} />
			</button>
			<div className="section-buttons">
				<SectionButton
					type="calendar"
					label="Calendar"
					selected={selected}
					onClick={() => setSelected("calendar")}
				/>
				<SectionButton
					type="list"
					label="All Items"
					selected={selected}
					onClick={() => setSelected("list")}
				/>
				<SectionButton
					type="perCategory"
					label="Per Category"
					selected={selected}
					onClick={() => setSelected("perCategory")}
				/>
			</div>
		</>
	);
};

export const SectionButton = ({
	label,
	type,
	selected,
	onClick,
}: {
	label: string;
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
			{label}
		</button>
	);
};
