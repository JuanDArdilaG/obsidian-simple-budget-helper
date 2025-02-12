import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useState, useCallback } from "react";
import {
	PieChart as RechartsPieChart,
	Pie,
	Sector,
	ResponsiveContainer,
} from "recharts";

export const PieChart = ({
	data,
}: {
	data?: { name: string; value: number }[] | undefined;
}) => {
	const [activeIndex, setActiveIndex] = useState(0);
	const onPieEnter = useCallback(
		(_: any, index: number) => {
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
					/>
				</RechartsPieChart>
			</ResponsiveContainer>
		</div>
	);
};
