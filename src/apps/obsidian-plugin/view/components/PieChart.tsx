import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useState, useCallback } from "react";
import {
	PieChart as RechartsPieChart,
	Pie,
	Sector,
	ResponsiveContainer,
} from "recharts";
import { Logger } from "../../../../contexts/Shared/infrastructure/logger";

export const PieChart = ({
	data,
	setSelectedCategory,
}: {
	data?: { name: string; value: number }[] | undefined;
	setSelectedCategory?: React.Dispatch<React.SetStateAction<string>>;
}) => {
	Logger.debug("PieChart", { data });
	const [activeIndex, setActiveIndex] = useState(0);
	const onPieEnter = useCallback(
		(a: any, index: number) => {
			console.log({ a, index });
			setActiveIndex(index);
		},
		[setActiveIndex]
	);
	return (
		<div style={{ width: "100%", height: 800 }}>
			<ResponsiveContainer>
				<RechartsPieChart>
					<Pie
						label={({ percent, name, value }) =>
							`${name} - ${new PriceValueObject(
								value
							).toString()}  (${(percent * 100).toFixed(2)}%)`
						}
						// label={renderCustomizedLabel}
						// labelLine={false}
						data={data}
						fill="#8884d8"
						dataKey="value"
						onClick={(a) => {
							if (setSelectedCategory)
								setSelectedCategory(a.name);
						}}
					/>
				</RechartsPieChart>
			</ResponsiveContainer>
		</div>
	);
};
