import { useContext, useMemo, useState } from "react";
import { CategoriesContext, ItemsContext } from "../../Contexts";
import { RecurrentItemsReport } from "contexts";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export const PerCategoryRecurrentItemsTab = ({}) => {
	const { recurrentItems } = useContext(ItemsContext);
	const { categoriesWithSubcategories } = useContext(CategoriesContext);

	const report = useMemo(
		() => new RecurrentItemsReport(recurrentItems),
		[recurrentItems]
	);

	return (
		<>
			{report
				.groupPerCategory(categoriesWithSubcategories)
				.map(
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
									<div key={subCategory.id.toString()}>
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

							<span
								style={{
									paddingLeft: "5px",
									color: "var(--color-green)",
								}}
							>
								{new RecurrentItemsReport(report.onlyExpenses())
									.getTotalPerMonth()
									.divide(
										new RecurrentItemsReport(
											report.onlyIncomes()
										)
											.getTotalPerMonth()
											.abs()
									)
									.times(new NumberValueObject(100))
									.toFixed(2)
									.abs()
									.valueOf()}
								%
							</span>
						</div>
					)
				)}
		</>
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
