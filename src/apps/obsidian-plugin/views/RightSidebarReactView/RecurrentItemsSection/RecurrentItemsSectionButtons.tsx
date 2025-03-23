import { CalendarClock, List, Logs } from "lucide-react";
import { SectionButton } from "../../../components/SectionButtons";

export type RecurrentItemsSectionSelection =
	| "calendar"
	| "list"
	| "perCategory";

export const RecurrentItemsSectionButtons = ({
	selected,
	setSelected,
}: {
	selected: RecurrentItemsSectionSelection;
	setSelected: (selected: RecurrentItemsSectionSelection) => void;
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
