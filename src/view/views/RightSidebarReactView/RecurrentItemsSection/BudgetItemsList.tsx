import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Forward } from "lucide-react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { App } from "obsidian";
import { useContext, useEffect, useMemo, useState } from "react";
import { SettingsContext } from "../RightSidebarReactView";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { RecordBudgetItemPanel } from "./RecordBudgetItemPanel";
import { BudgetItemsListContextMenu } from "./BudgetItemsListContextMenu";

export const BudgetItemsList = ({
	budgetItems,
	onRecord,
	totalPerMonth,
	app,
	selectedItem,
	setSelectedItem,
}: {
	budgetItems: { item: BudgetItemRecurrent; dates: Date[] }[];
	onRecord: (item: BudgetItem) => void;
	totalPerMonth?: boolean;
	app: App;
	selectedItem?: BudgetItemRecurrent;
	setSelectedItem: (item: BudgetItemRecurrent) => void;
}) => {
	const [showRecordPanel, setShowRecordPanel] =
		useState<BudgetItemRecurrent>();

	useEffect(() => {
		console.log({ showRecordPanelChange: showRecordPanel });
	}, [showRecordPanel]);

	const itemsInList = useMemo(() => {
		return new Budget(
			budgetItems
				.map(({ item, dates }) => {
					return dates.map((date) => {
						return new BudgetItemRecurrent(
							item.id,
							item.name,
							item.account,
							item.amount.toNumber(),
							item.category,
							item.type,
							new BudgetItemNextDate(date),
							item.path,
							item.frequency,
							item.history
						);
					});
				})
				.flat()
		).orderByNextDate().items;
	}, [budgetItems]);

	return (
		<div>
			<ul>
				{itemsInList.map((item, index) => (
					<li
						key={index}
						onContextMenu={(e) => {
							e.preventDefault();
							setSelectedItem(item);
						}}
					>
						<div className="two-columns-list">
							<span>
								{item.name}
								<br />
								{new Date(item.nextDate).toDateString()}
							</span>
							<span style={{ textAlign: "right" }}>
								{PriceValueObject.fromString(
									item.amount.toString()
								).toString()}
								<span
									style={{
										marginLeft: "8px",
										paddingTop: "20px",
									}}
								>
									<Forward
										style={{
											cursor: "pointer",
											color: "var(--color-green)",
										}}
										size={19}
										onClick={() => setShowRecordPanel(item)}
									/>
								</span>
								{totalPerMonth ? <br /> : ""}
								{totalPerMonth
									? `Per Month ≈ ${new PriceValueObject(
											item.perMonthAmount
									  )}`
									: ""}
								<br />
								<span
									style={{
										color:
											item.remainingDays.color === "red"
												? "var(--color-red)"
												: item.remainingDays.color ===
												  "yellow"
												? "var(--color-yellow)"
												: "var(--color-green)",
										fontSize: "0.9em",
										marginLeft: "8px",
									}}
								>
									{item.remainingDays.str}
								</span>
							</span>
						</div>
						{showRecordPanel && item === showRecordPanel && (
							<RecordBudgetItemPanel
								item={item}
								onRecord={onRecord}
								onClose={() => setShowRecordPanel(undefined)}
							/>
						)}
					</li>
				))}
			</ul>
			<h3>
				Total:{" "}
				{new PriceValueObject(
					totalPerMonth
						? new Budget(itemsInList).getTotalPerMonth()
						: new Budget(itemsInList).getTotal()
				).toString()}
			</h3>
		</div>
	);
};
