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
