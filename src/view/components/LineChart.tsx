import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { FunctionComponent } from "react";
import {
	LineChart as RechartsLineChart,
	CartesianGrid,
	Legend,
	Line,
	Tooltip,
	XAxis,
	LabelList,
	ResponsiveContainer,
	YAxis,
} from "recharts";

export const LineChart = ({
	data,
}: {
	data?: { name: string; value: number }[] | undefined;
}) => {
	return (
		<div style={{ width: "100%", height: 1000 }}>
			<ResponsiveContainer>
				<RechartsLineChart
					layout="vertical"
					data={data}
					margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
					style={{ backgroundColor: "white" }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<YAxis dataKey="name" type="category" />
					<XAxis dataKey="value" type="number" />
					{/* <YAxis tick={<CustomizedAxisTick />} /> */}
					<Tooltip />
					<Legend />
					<Line
						type="monotone"
						dataKey="value"
						stroke="var(--color-purple)"
					>
						<LabelList content={<CustomizedLabel />} />
					</Line>
				</RechartsLineChart>
			</ResponsiveContainer>
		</div>
		// <RechartsPieChart width={320} height={320}>
		// 	<Pie
		// 		data={data}
		// 		dataKey="value"
		// 		nameKey="name"
		// 		fill="var(--color-base-70)"
		// 		label
		// 		labelLine
		// 	>
		// 		<LabelList dataKey="name" />
		// 	</Pie>
		// </RechartsPieChart>
	);
};

const CustomizedLabel: FunctionComponent<any> = (props: any) => {
	const { x, y, stroke, value } = props;

	return (
		<text
			x={x}
			y={y}
			dy={-4}
			fill={stroke}
			fontSize={10}
			textAnchor="middle"
		>
			{new PriceValueObject(value ?? 0).toString()}
		</text>
	);
};

const CustomizedAxisTick: FunctionComponent<any> = (props: any) => {
	const { x, y, payload } = props;

	return (
		<g transform={`translate(${x},${y})`}>
			<text
				x={0}
				y={0}
				dy={16}
				textAnchor="end"
				fill="#666"
				transform="rotate(-35)"
			>
				{new PriceValueObject(payload.value ?? 0).toString()}
			</text>
		</g>
	);
};
