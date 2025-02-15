import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Forward } from "lucide-react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useContext, useEffect, useMemo, useState } from "react";
import { FileOperationsContext } from "../RightSidebarReactView";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { RecordBudgetItemPanel } from "./RecordBudgetItemPanel";
import { EditBudgetItemRecurrentPanel } from "modals/CreateBudgetItemModal/EditBudgetItemRecurrentPanel";

export const BudgetItemsList = ({
	budgetItems,
	onRecord,
	totalPerMonth,
	selectedItem,
	setSelectedItem,
	editionIsActive,
	setEditionIsActive,
}: {
	budgetItems: { item: BudgetItemRecurrent; dates: Date[] }[];
	onRecord: (item: BudgetItem) => void;
	totalPerMonth?: boolean;
	selectedItem?: BudgetItemRecurrent;
	setSelectedItem: (item: BudgetItemRecurrent) => void;
	editionIsActive: boolean;
	setEditionIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { itemOperations } = useContext(FileOperationsContext);
	const [showPanel, setShowPanel] = useState<{
		item: BudgetItemRecurrent;
		action: "edit" | "record";
	}>();

	useEffect(() => {
		console.log({ selectedItem, editionIsActive });
		setShowPanel(
			editionIsActive && selectedItem
				? { item: selectedItem, action: "edit" }
				: undefined
		);
	}, [editionIsActive, selectedItem]);

	useEffect(() => {
		if (!showPanel) {
			if (setEditionIsActive) setEditionIsActive(false);
		}
	}, [setEditionIsActive, showPanel]);

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
							item.subCategory,
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
					<div key={index}>
						<li
							onClick={() => {
								setShowPanel(undefined);
							}}
							onContextMenu={(e) => {
								e.preventDefault();
								setShowPanel(undefined);
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
											onClick={() =>
												setShowPanel({
													item,
													action: "record",
												})
											}
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
												item.remainingDays.color ===
												"red"
													? "var(--color-red)"
													: item.remainingDays
															.color === "yellow"
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
						</li>
						{showPanel && item === showPanel.item ? (
							showPanel?.action === "record" ? (
								<RecordBudgetItemPanel
									item={item}
									onRecord={onRecord}
									onClose={() => setShowPanel(undefined)}
								/>
							) : (
								<EditBudgetItemRecurrentPanel
									item={item}
									onEdit={async (item) => {
										await itemOperations(item, "modify");
									}}
									onClose={() => setShowPanel(undefined)}
								/>
							)
						) : undefined}
					</div>
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
