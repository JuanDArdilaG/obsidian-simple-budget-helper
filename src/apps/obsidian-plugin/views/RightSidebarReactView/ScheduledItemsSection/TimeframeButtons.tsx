export type CalendarTimeframe =
	| "3years"
	| "year"
	| "3months"
	| "month"
	| "2weeks"
	| "week"
	| "3days";

export const TimeframeButtons = ({
	selected,
	setSelected,
}: {
	selected?: CalendarTimeframe;
	setSelected: (selected: CalendarTimeframe) => void;
}) => {
	return (
		<div className="section-buttons">
			{/* <SectionButton
				type="3days"
				label="3d"
				selected={selected}
				onClick={() => setSelected("3days")}
			/>
			<SectionButton
				type="week"
				label="1w"
				selected={selected}
				onClick={() => setSelected("week")}
			/>
			<SectionButton
				type="2weeks"
				label="2w"
				selected={selected}
				onClick={() => setSelected("2weeks")}
			/>
			<SectionButton
				type="month"
				label="1mo"
				selected={selected}
				onClick={() => setSelected("month")}
			/>
			<SectionButton
				type="3months"
				label="3mo"
				selected={selected}
				onClick={() => setSelected("3months")}
			/>
			<SectionButton
				type="year"
				label="1y"
				selected={selected}
				onClick={() => setSelected("year")}
			/>
			<SectionButton
				type="3years"
				label="3y"
				selected={selected}
				onClick={() => setSelected("3years")}
			/> */}
		</div>
	);
};
