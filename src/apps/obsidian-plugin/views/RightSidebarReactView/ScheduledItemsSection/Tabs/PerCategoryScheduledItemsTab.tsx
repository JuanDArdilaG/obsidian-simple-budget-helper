import { PieValueType } from "@mui/x-charts";
import { pieArcLabelClasses, PieChart } from "@mui/x-charts/PieChart";
import { Select } from "apps/obsidian-plugin/components/Select";
import { useLogger } from "apps/obsidian-plugin/hooks";
import {
	GroupByCategoryWithBalance,
	GroupBySubcategoryWithBalance,
} from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { TransactionsReport } from "contexts/Reports/domain";
import { useContext, useEffect, useMemo, useState } from "react";
import { TransactionAmount } from "../../../../../../contexts/Transactions/domain";
import { TransactionsContext } from "../../Contexts";

const monthAbbreviations = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

// MUI X Charts default color palette - organized by color families (dark to light)
const chartColors = [
	// Purples (dark to light)
	"#673AB7", // Deep Purple
	"#3F51B5", // Indigo
	"#9C27B0", // Purple
	"#E91E63", // Pink

	// Blues (dark to light)
	"#1976D2", // Blue Dark
	"#2196F3", // Blue
	"#03A9F4", // Light Blue
	"#00BCD4", // Cyan

	// Greens (dark to light)
	"#009688", // Teal
	"#388E3C", // Green Dark
	"#4CAF50", // Green
	"#8BC34A", // Light Green
	"#CDDC39", // Lime

	// Yellows/Oranges/Reds (dark to light)
	"#F44336", // Red,
	"#FF5722", // Deep Orange
	"#F57C00", // Orange Dark
	"#FF9800", // Orange
	"#FFC107", // Amber
	"#FFEB3B", // Yellow

	// Neutrals
	"#424242", // Grey Dark
	"#9E9E9E", // Grey
	"#795548", // Brown
	"#A1887F", // Light Brown
	"#607D8B", // Blue Grey
];

export const PerCategoryItemsTab = () => {
	const logger = useLogger("PerCategoryItemsTab");
	const {
		transactions,
		updateTransactions,
		useCases: { groupByCategoryWithAccumulatedBalance },
	} = useContext(TransactionsContext);

	useEffect(() => {
		updateTransactions();
	}, []);

	const transactionsReport = useMemo(
		() => new TransactionsReport(transactions).sortedByAmount(),
		[transactions]
	);

	const filteredHistory = useMemo(() => {
		return transactionsReport.groupByDays();
	}, [transactionsReport]);

	const years = useMemo(() => {
		return filteredHistory
			? [
					"",
					...Object.keys(filteredHistory).toSorted((a, b) =>
						b.localeCompare(a)
					),
			  ]
			: [];
	}, [filteredHistory]);

	// Initialize with default values
	const currentYear = new Date().getFullYear();
	const lastMonth = new Date();
	lastMonth.setMonth(lastMonth.getMonth() - 1);
	const lastMonthAbbr = monthAbbreviations[lastMonth.getMonth()];

	const [selectedYear, setSelectedYear] = useState(String(currentYear));
	const [selectedMonth, setSelectedMonth] = useState(lastMonthAbbr);
	const [selectedType, setSelectedType] = useState<"expense" | "income">(
		"expense"
	);

	const months = useMemo(() => {
		if (!selectedYear) return [];
		return filteredHistory[Number(selectedYear)]
			? [
					"",
					...Object.keys(
						filteredHistory[Number(selectedYear)]
					).toSorted((a, b) => {
						const indexA = monthAbbreviations.indexOf(a);
						const indexB = monthAbbreviations.indexOf(b);
						return indexA - indexB;
					}),
			  ]
			: [];
	}, [filteredHistory, selectedYear]);

	const [groupedByCategory, setGroupedByCategory] =
		useState<GroupByCategoryWithBalance>({});
	useEffect(() => {
		let filteredReport = transactionsReport;
		filteredReport =
			selectedType === "expense"
				? filteredReport.onlyExpenses()
				: filteredReport.onlyIncomes();
		if (selectedYear)
			filteredReport = filteredReport.filterByYear(Number(selectedYear));
		if (selectedMonth)
			filteredReport = filteredReport.filterByMonth(
				monthAbbreviations.indexOf(selectedMonth)
			);

		groupByCategoryWithAccumulatedBalance
			.execute(filteredReport)
			.then((result) => {
				setGroupedByCategory(result);
			});
	}, [
		filteredHistory,
		selectedType,
		selectedYear,
		selectedMonth,
		transactionsReport,
	]);

	const [selectedCategory, setSelectedCategory] = useState<string>();
	const [selectedSubcategory, setSelectedSubcategory] = useState<string>();

	const groupedBySubCategory: GroupBySubcategoryWithBalance = useMemo(() => {
		if (!selectedCategory || !groupedByCategory[selectedCategory])
			return {} as GroupBySubcategoryWithBalance;
		return groupedByCategory[selectedCategory].subCategories;
	}, [groupedByCategory, selectedCategory]);

	// Get transactions for the selected subcategory
	const subcategoryTransactions = useMemo(() => {
		if (
			!selectedSubcategory ||
			!groupedBySubCategory[selectedSubcategory]
		) {
			return [];
		}
		return groupedBySubCategory[selectedSubcategory].transactions;
	}, [groupedBySubCategory, selectedSubcategory]);

	const byCategoryChartData: (PieValueType & { categoryKey: string })[] =
		useMemo(
			() =>
				Object.keys(groupedByCategory)
					.map((category, index) => ({
						id: index,
						label: groupedByCategory[category].category.name.value,
						value: Math.abs(
							groupedByCategory[category].balance.value
						),
						categoryKey: category,
					}))
					.sort((a, b) => a.value - b.value),
			[groupedByCategory]
		);

	const bySubcategoryChartData: (PieValueType & {
		subcategoryKey: string;
	})[] = useMemo(
		() =>
			Object.keys(groupedBySubCategory)
				.map((subcategory, index) => ({
					id: index,
					label: groupedBySubCategory[subcategory].subcategory.name
						.value,
					value: Math.abs(
						groupedBySubCategory[subcategory].balance.value
					),
					subcategoryKey: subcategory,
				}))
				.sort((a, b) => a.value - b.value),
		[groupedBySubCategory]
	);

	// Create transaction chart data
	const byTransactionChartData = useMemo(() => {
		// Group transactions by name and sum their amounts
		const transactionGroups = subcategoryTransactions.reduce(
			(groups, transaction) => {
				const name = transaction.name.value;
				if (!groups[name]) {
					groups[name] = {
						name,
						totalAmount: 0,
						count: 0,
					};
				}
				groups[name].totalAmount += Math.abs(
					transaction.fromAmount.value
				);
				groups[name].count += 1;
				return groups;
			},
			{} as Record<
				string,
				{ name: string; totalAmount: number; count: number }
			>
		);

		// Convert to chart data format and sort by value ascending
		return Object.values(transactionGroups)
			.map((group, index) => ({
				id: index,
				label:
					group.count > 1
						? `${group.name} (${group.count})`
						: group.name,
				value: group.totalAmount,
			}))
			.sort((a, b) => a.value - b.value);
	}, [subcategoryTransactions]);

	return (
		<>
			<div
				style={{
					display: "flex",
					justifyContent: "space-evenly",
					gap: "20px",
				}}
			>
				<Select
					id="type"
					label="Type"
					onChange={(type: string) => {
						setSelectedType(type as "expense" | "income");
						setSelectedCategory(undefined);
					}}
					value={selectedType}
					values={["expense", "income"]}
				/>
				<Select
					id="year"
					label="Year"
					onChange={(year: string) => {
						setSelectedYear(year);
						setSelectedMonth("");
						setSelectedCategory("");
					}}
					value={selectedYear ? String(selectedYear) : ""}
					values={years.map((year) => String(year))}
				/>
				<Select
					id="month"
					label="Month"
					onChange={(month: string) => {
						setSelectedMonth(month);
						setSelectedCategory("");
					}}
					value={selectedMonth}
					values={months}
				/>
			</div>

			{/* Navigation Breadcrumbs */}
			{(selectedCategory || selectedSubcategory) && (
				<div
					style={{
						marginTop: "10px",
						padding: "10px",
						backgroundColor: "var(--background-secondary)",
						borderRadius: "4px",
						fontSize: "0.9em",
					}}
				>
					<span style={{ color: "var(--text-muted)" }}>
						Viewing:{" "}
					</span>
					{selectedCategory && (
						<>
							<span
								style={{
									color: "var(--text-normal)",
									fontWeight: "bold",
									cursor: "pointer",
								}}
								onClick={() => {
									setSelectedCategory(undefined);
									setSelectedSubcategory(undefined);
								}}
							>
								{
									groupedByCategory[selectedCategory]
										?.category.name.value
								}
							</span>
							{selectedSubcategory && (
								<>
									<span
										style={{ color: "var(--text-muted)" }}
									>
										{" "}
										→{" "}
									</span>
									<span
										style={{
											color: "var(--text-normal)",
											fontWeight: "bold",
											cursor: "pointer",
										}}
										onClick={() =>
											setSelectedSubcategory(undefined)
										}
									>
										{
											groupedBySubCategory[
												selectedSubcategory
											]?.subcategory.name.value
										}
									</span>
								</>
							)}
						</>
					)}
				</div>
			)}

			<PieChart
				colors={chartColors}
				sx={{
					width: "100%",
					marginTop: "20px",
					[`& .${pieArcLabelClasses.root}`]: {
						fontWeight: "bold",
					},
					"& .MuiChartsLegend-root": {
						display: "none",
					},
				}}
				series={[
					{
						arcLabel: ({ value }: { value: number }) =>
							new TransactionAmount(value).toString(),
						arcLabelMinAngle: 18,
						data: byCategoryChartData,
						highlightScope: { fade: "global", highlight: "item" },
						faded: {
							innerRadius: 30,
							additionalRadius: -30,
							color: "gray",
						},
					},
				]}
				onItemClick={(_, id) => {
					logger.debug("onItemClick", { id });
					const clickedData = byCategoryChartData[id.dataIndex];
					setSelectedCategory(
						groupedByCategory[clickedData.categoryKey].category.id
							.value
					);
					setSelectedSubcategory(undefined);
				}}
				width={400}
				height={400}
			/>

			{/* Custom Legend for Categories */}
			<div
				style={{
					marginTop: "10px",
					display: "flex",
					flexWrap: "wrap",
					gap: "10px",
				}}
			>
				{byCategoryChartData.map((item, index) => (
					<div
						key={index}
						style={{
							display: "flex",
							alignItems: "center",
							gap: "5px",
							cursor: "pointer",
							padding: "5px 10px",
							borderRadius: "4px",
							backgroundColor: "var(--background-secondary)",
							border: "1px solid var(--background-modifier-border)",
						}}
						onClick={() => {
							const clickedData = byCategoryChartData[index];
							setSelectedCategory(
								groupedByCategory[clickedData.categoryKey]
									.category.id.value
							);
							setSelectedSubcategory(undefined);
						}}
					>
						<div
							style={{
								width: "12px",
								height: "12px",
								borderRadius: "50%",
								backgroundColor:
									chartColors[index % chartColors.length],
							}}
						/>
						<span style={{ fontSize: "0.9em" }}>
							{typeof item.label === "string"
								? item.label
								: "Unknown"}{" "}
							({new TransactionAmount(item.value).toString()})
						</span>
					</div>
				))}
			</div>

			{selectedCategory && (
				<PieChart
					colors={chartColors}
					sx={{
						width: "100%",
						marginTop: "20px",
						[`& .${pieArcLabelClasses.root}`]: {
							fontWeight: "bold",
						},
						"& .MuiChartsLegend-root": {
							display: "none",
						},
					}}
					series={[
						{
							arcLabel: ({ value }: { value: number }) =>
								new TransactionAmount(value).toString(),
							arcLabelMinAngle: 18,
							data: bySubcategoryChartData,
							highlightScope: {
								fade: "global",
								highlight: "item",
							},
							faded: {
								innerRadius: 30,
								additionalRadius: -30,
								color: "gray",
							},
						},
					]}
					onItemClick={(_, id) => {
						logger.debug("onSubcategoryClick", { id });
						const clickedData =
							bySubcategoryChartData[id.dataIndex];
						setSelectedSubcategory(
							groupedBySubCategory[clickedData.subcategoryKey]
								.subcategory.id.value
						);
					}}
					width={400}
					height={400}
				/>
			)}

			{/* Custom Legend for Subcategories */}
			{selectedCategory && (
				<div
					style={{
						marginTop: "10px",
						display: "flex",
						flexWrap: "wrap",
						gap: "10px",
					}}
				>
					{bySubcategoryChartData.map((item, index) => (
						<div
							key={item.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "5px",
								cursor: "pointer",
								padding: "5px 10px",
								borderRadius: "4px",
								backgroundColor: "var(--background-secondary)",
								border: "1px solid var(--background-modifier-border)",
							}}
							onClick={() => {
								const clickedData =
									bySubcategoryChartData[index];
								setSelectedSubcategory(
									groupedBySubCategory[
										clickedData.subcategoryKey
									].subcategory.id.value
								);
							}}
						>
							<div
								style={{
									width: "12px",
									height: "12px",
									borderRadius: "50%",
									backgroundColor:
										chartColors[index % chartColors.length],
								}}
							/>
							<span style={{ fontSize: "0.9em" }}>
								{typeof item.label === "string"
									? item.label
									: "Unknown"}{" "}
								({new TransactionAmount(item.value).toString()})
							</span>
						</div>
					))}
				</div>
			)}

			{selectedSubcategory && byTransactionChartData.length > 0 && (
				<PieChart
					colors={chartColors}
					sx={{
						width: "100%",
						marginTop: "20px",
						[`& .${pieArcLabelClasses.root}`]: {
							fontWeight: "bold",
						},
						"& .MuiChartsLegend-root": {
							display: "none",
						},
					}}
					series={[
						{
							arcLabel: ({ value }: { value: number }) =>
								new TransactionAmount(value).toString(),
							arcLabelMinAngle: 18,
							data: byTransactionChartData,
							highlightScope: {
								fade: "global",
								highlight: "item",
							},
							faded: {
								innerRadius: 30,
								additionalRadius: -30,
								color: "gray",
							},
						},
					]}
					width={400}
					height={400}
				/>
			)}

			{/* Custom Legend for Transactions */}
			{selectedSubcategory && byTransactionChartData.length > 0 && (
				<div
					style={{
						marginTop: "10px",
						display: "flex",
						flexWrap: "wrap",
						gap: "10px",
					}}
				>
					{byTransactionChartData.map((item, index) => (
						<div
							key={item.id}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "5px",
								padding: "5px 10px",
								borderRadius: "4px",
								backgroundColor: "var(--background-secondary)",
								border: "1px solid var(--background-modifier-border)",
							}}
						>
							<div
								style={{
									width: "12px",
									height: "12px",
									borderRadius: "50%",
									backgroundColor:
										chartColors[index % chartColors.length],
								}}
							/>
							<span style={{ fontSize: "0.9em" }}>
								{item.label} (
								{new TransactionAmount(item.value).toString()})
							</span>
						</div>
					))}
				</div>
			)}
		</>
	);
};
