import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Forward } from "lucide-react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { RecordBudgetItemModalRoot } from "./RecordBudgetItemModalRoot";
import { App } from "obsidian";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../RightSidebarReactView";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

export const BudgetItemsList = ({
	budgetItems,
	onRecord,
	totalPerMonth,
	app,
}: {
	budgetItems: { item: BudgetItemRecurrent; dates: Date[] }[];
	onRecord: (item: BudgetItem) => void;
	totalPerMonth?: boolean;
	app: App;
}) => {
	const settings = useContext(SettingsContext);
	const [itemsInList, setItemsInList] = useState<BudgetItemRecurrent[]>([]);
	useEffect(() => {
		setItemsInList(
			new Budget(
				budgetItems
					.map(({ item, dates }) => {
						return dates.map((date) => {
							return new BudgetItemRecurrent(
								item.id,
								item.name,
								item.amount,
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
			).orderByNextDate().items
		);
	}, [budgetItems]);

	return (
		<div>
			<ul>
				{itemsInList.map((item, index) => (
					<li
						key={index}
						className="two-columns-list"
						onClick={async () => {
							if (item.path) {
								const leaf = app.workspace.getLeaf(
									settings.openInNewTab
								);
								const file = app.vault.getFileByPath(item.path);
								if (!file) return;
								await leaf.openFile(file);
							}
						}}
					>
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
									}}
									size={19}
									color="mediumspringgreen"
									onClick={() => {
										// item.record();
										new RecordBudgetItemModalRoot(
											app,
											item,
											onRecord
										).open();
									}}
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
									color: item.remainingDays.color,
									fontSize: "0.9em",
									marginLeft: "8px",
								}}
							>
								{item.remainingDays.str}
							</span>
						</span>
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
