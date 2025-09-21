import { CalendarClock, List, Logs } from "lucide-react";
import { SectionButton } from "../../../components/SectionButtons";

export type ScheduledItemsSectionSelection =
	| "calendar"
	| "list"
	| "perCategory";

export const ScheduledItemsSectionButtons = ({
	selected,
	setSelected,
}: {
	selected: ScheduledItemsSectionSelection;
	setSelected: (selected: ScheduledItemsSectionSelection) => void;
}) => {
	return (
		<div className="section-buttons">
			<SectionButton
				type="calendar"
				label="Upcoming"
				icon={
					<CalendarClock
						size={16}
						style={{ color: "var(--color-yellow)" }}
					/>
				}
				selected={selected}
				onClick={() => setSelected("calendar")}
			/>
			<SectionButton
				type="list"
				label="All"
				icon={
					<List size={16} style={{ color: "var(--color-yellow)" }} />
				}
				selected={selected}
				onClick={() => setSelected("list")}
			/>
			<SectionButton
				label="Per Category"
				type="perCategory"
				icon={
					<Logs size={16} style={{ color: "var(--color-yellow)" }} />
				}
				selected={selected}
				onClick={() => setSelected("perCategory")}
			/>
		</div>
	);
};
