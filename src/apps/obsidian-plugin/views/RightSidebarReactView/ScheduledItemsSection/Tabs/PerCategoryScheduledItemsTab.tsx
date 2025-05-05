import { useContext, useEffect, useMemo, useState } from "react";
import {
	CategoriesContext,
	ItemsContext,
	TransactionsContext,
} from "../../Contexts";
import {
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { ItemsReport, TransactionsReport } from "contexts/Reports/domain";
import { Select } from "apps/obsidian-plugin/components/Select";
import { pieArcLabelClasses, PieChart } from "@mui/x-charts/PieChart";
import { useLogger } from "apps/obsidian-plugin/hooks";
import {
	GroupByCategoryWithBalance,
	GroupBySubcategoryWithBalance,
} from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { PieValueType } from "@mui/x-charts";

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

export const PerCategoryItemsTab = () => {
	const logger = useLogger("PerCategoryItemsTab");
	const { scheduledItems } = useContext(ItemsContext);
	const {
		transactions,
		updateTransactions,
		useCases: { groupByCategoryWithAccumulatedBalance },
	} = useContext(TransactionsContext);
	const { categoriesWithSubcategories } = useContext(CategoriesContext);

	useEffect(() => {
		updateTransactions();
	}, []);

	const itemsReport = useMemo(
		() => new ItemsReport(scheduledItems),
		[scheduledItems]
	);

	const transactionsReport = useMemo(
		() => new TransactionsReport(transactions).sortedByAmount(),
		[transactions]
	);

	const itemsWithCategoryAndSubCategory = useMemo(
		() => itemsReport.groupPerCategory(categoriesWithSubcategories),
		[itemsReport, categoriesWithSubcategories]
	);

	const filteredHistory = useMemo(() => {
		return transactionsReport.groupByDays();
	}, [transactionsReport]);

	logger.debug("filteredHistory", {
		transactions,
		transactionsReport,
		filteredHistory,
	});

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

	logger.debug("years", { years });

	const [selectedYear, setSelectedYear] = useState("");
	const [selectedMonth, setSelectedMonth] = useState("");
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

	logger.debug("months", { months });

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
				logger.logger.debug("groupedByCategory", {
					selectedType,
					result,
				});
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

	const groupedBySubCategory: GroupBySubcategoryWithBalance = useMemo(() => {
		if (!selectedCategory || !groupedByCategory[selectedCategory])
			return {} as GroupBySubcategoryWithBalance;
		return groupedByCategory[selectedCategory].subCategories;
	}, [groupedByCategory, selectedCategory]);

	const byCategoryChartData: PieValueType[] = useMemo(
		() =>
			Object.keys(groupedByCategory).map((category, index) => ({
				id: index,
				label: groupedByCategory[category].category.name.value,
				value: Math.abs(groupedByCategory[category].balance.value),
			})),
		[groupedByCategory]
	);

	const bySubcategoryChartData = useMemo(
		() =>
			Object.keys(groupedBySubCategory).map((subcategory, index) => ({
				id: index,
				label: groupedBySubCategory[subcategory].subcategory.name.value,
				value: Math.abs(
					groupedBySubCategory[subcategory].balance.value
				),
			})),
		[groupedBySubCategory]
	);

	logger.debug("pieChartData", { pieChartData: byCategoryChartData });

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
			<PieChart
				sx={{
					width: "100%",
					marginTop: "20px",
					[`& .${pieArcLabelClasses.root}`]: {
						fontWeight: "bold",
					},
				}}
				series={[
					{
						arcLabel: ({ value }) =>
							new PriceValueObject(value, {
								withSign: true,
								decimals: 0,
							}).toString(),
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
					const category =
						Object.keys(groupedByCategory)[id.dataIndex];
					setSelectedCategory(
						groupedByCategory[category].category.id.value
					);
				}}
				width={400}
				height={400}
			/>
			{selectedCategory && (
				<PieChart
					sx={{
						width: "100%",
						marginTop: "20px",
						[`& .${pieArcLabelClasses.root}`]: {
							fontWeight: "bold",
						},
					}}
					series={[
						{
							arcLabel: ({ value }) =>
								new PriceValueObject(value, {
									withSign: true,
									decimals: 0,
								}).toString(),
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
					width={400}
					height={400}
				/>
			)}
			{itemsWithCategoryAndSubCategory.items.map(
				({
					category: {
						category,
						percentageOperation,
						percentageInverseOperation,
					},
					subCategoriesItems,
				}) => (
					<div key={category.id.toString()}>
						<h2 style={{ borderBottom: "1px solid gray" }}>
							{category.name.toString()}{" "}
							<span
								style={{
									fontSize: "0.8em",
									paddingLeft: "5px",
									color: "var(--color-red)",
								}}
							>
								{percentageOperation.toString()}%
							</span>
							<span
								style={{
									fontSize: "0.8em",
									paddingLeft: "5px",
									color: "var(--color-green)",
								}}
							>
								{percentageInverseOperation.toString()}%
							</span>
						</h2>
						{subCategoriesItems.map(
							({
								subCategory: {
									subCategory,
									percentageOperation,
									percentageInverseOperation,
								},
								items,
							}) => (
								<div
									key={subCategory.id.toString()}
									style={{ marginBottom: "45px" }}
								>
									<h5
										style={{
											borderBottom: "1px solid gray",
										}}
									>
										{subCategory.name.toString()}{" "}
										<span
											style={{
												fontSize: "0.8em",
												paddingLeft: "5px",
												color: "var(--color-red)",
											}}
										>
											{percentageOperation.toString()}%
										</span>
										<span
											style={{
												fontSize: "0.8em",
												paddingLeft: "5px",
												color: "var(--color-green)",
											}}
										>
											{percentageInverseOperation.toString()}
											%
										</span>
									</h5>
									{items.map(
										({
											item,
											percentageOperation,
											percentageInverseOperation,
										}) => (
											<div key={item.id.toString()}>
												{item.name.toString()}{" "}
												<span
													style={{
														fontSize: "0.8em",
														paddingLeft: "5px",
														color: "var(--color-red)",
													}}
												>
													{percentageOperation.toString()}
													%
												</span>
												<span
													style={{
														fontSize: "0.8em",
														paddingLeft: "5px",
														color: "var(--color-green)",
													}}
												>
													{percentageInverseOperation.toString()}
													%
												</span>
											</div>
										)
									)}
								</div>
							)
						)}
					</div>
				)
			)}
			<h4>
				Total:{" "}
				<span
					style={{
						fontSize: "1.2em",
						paddingLeft: "5px",
						color: "var(--color-red)",
					}}
				>
					{itemsWithCategoryAndSubCategory.perMonthExpensesPercentage.toString()}
					%
				</span>
				<span
					style={{
						fontSize: "1.2em",
						paddingLeft: "5px",
						color: "var(--color-green)",
					}}
				>
					{
						itemsReport
							.onlyExpenses()
							.getTotalPerMonth()
							.divide(
								itemsReport
									.onlyIncomes()
									.getTotalPerMonth()
									.abs()
							)
							.times(new NumberValueObject(100))
							.fixed(2)
							.abs().value
					}
					%
				</span>
			</h4>
		</>
	);
};
