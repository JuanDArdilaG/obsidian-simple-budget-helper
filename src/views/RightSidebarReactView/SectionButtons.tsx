import { RefreshCcw } from "lucide-react";
import { useContext } from "react";
import { BudgetContext } from "./RightSidebarReactView";

export type SidebarSections = "recurrentItems" | "accounting";

export const SectionButtons = ({
	selected,
	setSelected,
	refresh,
}: {
	selected: SidebarSections;
	setSelected: (selected: SidebarSections) => void;
	refresh: () => void;
}) => {
	const { updateBudget } = useContext(BudgetContext);

	return (
		<div className="section-buttons-container">
			<button
				style={{ float: "left" }}
				onClick={async () => {
					refresh();
					await updateBudget();
				}}
			>
				<RefreshCcw size={16} />
			</button>
			<div className="section-buttons">
				<SectionButton
					type="recurrentItems"
					label="Recurrent Items"
					selected={selected}
					onClick={() => setSelected("recurrentItems")}
				/>
				<SectionButton
					type="accounting"
					label="Accounting"
					selected={selected}
					onClick={() => setSelected("accounting")}
				/>
			</div>
		</div>
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
