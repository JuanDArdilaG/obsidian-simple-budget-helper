import { useContext, useState } from "react";
import { AppContext } from "../RightSidebarReactView";

export const PerCategoryRightSidebarReactTab = ({}) => {
	const {} = useContext(AppContext);

	// const years = useMemo(() => {
	// 	return filteredHistory
	// 		? Object.keys(filteredHistory).map((year) => Number(year))
	// 		: [];
	// }, [filteredHistory]);
	// Logger.debug("years", { years });

	// const [selectedYear, setSelectedYear] = useState(years[0]);
	// useEffect(() => {
	// 	setSelectedYear(years[0]);
	// }, [years]);

	// const months = useMemo(() => {
	// 	return filteredHistory[selectedYear]
	// 		? Object.keys(filteredHistory[selectedYear])
	// 		: [];
	// }, [filteredHistory, selectedYear]);
	// Logger.debug("months", { months });
	// const [selectedMonth, setSelectedMonth] = useState(months[0]);
	// useEffect(() => {
	// 	setSelectedMonth(months[0]);
	// }, [months]);

	// const expensesGroupedByCategory = useMemo(() => {
	// 	if (!filteredHistory[selectedYear][selectedMonth]) return [];

	// 	const group = BudgetHistory.groupByCategory(
	// 		budget,
	// 		filteredHistory[selectedYear][selectedMonth]
	// 	);

	// 	return Object.keys(group).reduce(
	// 		(acc: { name: string; value: number }[], category) => {
	// 			const balance = group[category].onlyExpense().getBalance();
	// 			if (balance === 0) return acc;
	// 			Logger.debug("category", {
	// 				name: category,
	// 				value: balance,
	// 			});
	// 			return [
	// 				...acc,
	// 				{
	// 					name: category,
	// 					value: Math.abs(balance),
	// 				},
	// 			];
	// 		},
	// 		[]
	// 	);
	// }, [filteredHistory, selectedYear, selectedMonth, budget]);

	// const incomesGroupedByCategory = useMemo(() => {
	// 	if (!filteredHistory[selectedYear][selectedMonth]) return [];

	// 	const group = BudgetHistory.groupByCategory(
	// 		budget,
	// 		filteredHistory[selectedYear][selectedMonth]
	// 	);

	// 	return Object.keys(group).reduce(
	// 		(acc: { name: string; value: number }[], category) => {
	// 			const balance = group[category].onlyIncome().getBalance();
	// 			if (balance === 0) return acc;
	// 			Logger.debug("category", {
	// 				name: category,
	// 				value: balance,
	// 			});
	// 			return [
	// 				...acc,
	// 				{
	// 					name: category,
	// 					value: Math.abs(balance),
	// 				},
	// 			];
	// 		},
	// 		[]
	// 	);
	// }, [filteredHistory, selectedYear, selectedMonth, budget]);

	const [selectedType, setSelectedType] = useState("expense");
	const [selectedCategory, setSelectedCategory] = useState("");

	// const groupedBySubCategory = useMemo(() => {
	// 	Logger.debug("groupedBySubCategory", {
	// 		selectedCategory,
	// 		selectedYear,
	// 		selectedMonth,
	// 	});

	// 	if (!filteredHistory[selectedYear][selectedMonth]) return [];

	// 	const group = BudgetHistory.groupBySubCategory(
	// 		budget,
	// 		selectedCategory,
	// 		filteredHistory[selectedYear][selectedMonth]
	// 	);

	// 	return Object.keys(group).reduce(
	// 		(acc: { name: string; value: number }[], category) => {
	// 			const balance = (
	// 				selectedType === "expense"
	// 					? group[category].onlyExpense()
	// 					: group[category].onlyIncome()
	// 			).getBalance();
	// 			if (balance === 0) return acc;
	// 			return [
	// 				...acc,
	// 				{
	// 					name: category,
	// 					value: Math.abs(balance),
	// 				},
	// 			];
	// 		},
	// 		[]
	// 	);
	// }, [
	// 	budget,
	// 	filteredHistory,
	// 	selectedYear,
	// 	selectedMonth,
	// 	selectedType,
	// 	selectedCategory,
	// ]);

	// useConsoleLog({
	// 	title: "groupedByCategory",
	// 	data: expensesGroupedByCategory,
	// });

	return (
		<></>
		// <RightSidebarReactTab title="Per Category">
		// 	<Select
		// 		id="type"
		// 		label="Type"
		// 		onChange={(type: string) => setSelectedType(type)}
		// 		value={selectedType}
		// 		values={["expense", "income"]}
		// 	/>
		// 	<Select
		// 		id="year"
		// 		label="Year"
		// 		onChange={(year: number) => setSelectedYear(year)}
		// 		value={selectedYear}
		// 		values={years}
		// 	/>
		// 	<Select
		// 		id="month"
		// 		label="Month"
		// 		onChange={(month: string) => setSelectedMonth(month)}
		// 		value={selectedMonth}
		// 		values={months}
		// 	/>
		// 	{selectedType === "expense" && (
		// 		<PieChart
		// 			data={expensesGroupedByCategory}
		// 			setSelectedCategory={setSelectedCategory}
		// 		/>
		// 	)}
		// 	{selectedType === "income" && (
		// 		<PieChart
		// 			data={incomesGroupedByCategory}
		// 			setSelectedCategory={setSelectedCategory}
		// 		/>
		// 	)}

		// 	{selectedCategory && <PieChart data={groupedBySubCategory} />}
		// </RightSidebarReactTab>
	);
};
