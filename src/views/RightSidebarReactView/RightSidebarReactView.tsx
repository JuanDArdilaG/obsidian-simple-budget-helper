import { useState } from "react";
import { SectionButtons, SectionSelection } from "./components/SectionButtons";
import { CalendarRightSidebarReactTab } from "./CalendarRightSidebarReactView";
import { Budget } from "src/Budget";

export const RightSidebarReactView = ({
	rootFolder,
	budget,
}: {
	rootFolder: string;
	budget: Budget;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("calendar");

	return (
		<>
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab
					budget={budget.orderByNextDate()}
				/>
			)}
		</>
	);
};
