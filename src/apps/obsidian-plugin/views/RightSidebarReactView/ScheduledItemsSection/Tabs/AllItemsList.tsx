import { useLogger } from "apps/obsidian-plugin/hooks";
import { ERecurrenceState, Item } from "contexts/Items/domain";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
import { AccountsContext } from "../../Contexts";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { ItemReportContext } from "../../Contexts/ItemReportContext";
import { ReportBalance } from "contexts/Reports/domain";
import { EditItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemPanel";

export const AllItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: Item[];
	selectedItem?: Item;
	setSelectedItem: React.Dispatch<React.SetStateAction<Item | undefined>>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("AllItemsList");
	const { getAccountByID } = useContext(AccountsContext);
	const {
		useCases: { getTotalPerMonth },
	} = useContext(ItemReportContext);

	const itemsReport = useMemo(() => new ItemsReport(items), [items]);
	const [showPanel, setShowPanel] = useState<{
		item: Item;
		action?: "edit" | "record";
	}>();

	useEffect(() => {
		logger.debug("item selected for action", {
			selectedItem,
			action,
		});
		if (selectedItem) {
			setShowPanel({ item: selectedItem, action });
		}
	}, [action, selectedItem]);

	useEffect(() => {
		if (!showPanel) {
			if (action) setAction(undefined);
		}
	}, [setAction, showPanel]);

	const [perMonthExpenses, setPerMonthExpenses] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({ report: itemsReport, type: "expenses" })
			.then((total) => setPerMonthExpenses(total));
	}, [itemsReport]);

	const [perMonthIncomes, setPerMonthIncomes] = useState(
		ReportBalance.zero()
	);
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: itemsReport,
				type: "incomes",
			})
			.then((total) => setPerMonthIncomes(total));
	}, [itemsReport]);

	const [perMonth, setPerMonth] = useState(ReportBalance.zero());
	useEffect(() => {
		getTotalPerMonth
			.execute({
				report: itemsReport,
				type: "all",
			})
			.then((total) => setPerMonth(total));
	}, [itemsReport]);

	return (
		<div>
			<ul>
				{items
					.map((item) => {
						const recurrence = item.recurrences.find(
							(recurrence) =>
								recurrence.state === ERecurrenceState.PENDING
						);
						return { item, recurrence };
					})
					.filter(({ recurrence }) => recurrence)
					.toSorted(
						(
							{ recurrence: a, item: itemA },
							{ recurrence: b, item: itemB }
						) => {
							const result = a!.date.compareTo(b!.date);
							if (result !== 0) return result;
							// Secondary sort criteria
							return itemA.name.compareTo(itemB.name);
						}
					)
					.map(({ item, recurrence }) => {
						const account = getAccountByID(item.account);
						const toAccount = item.toAccount
							? getAccountByID(item.toAccount)
							: undefined;
						const remainingDays =
							recurrence!.date.getRemainingDays() ?? 0;
						const totalRecurrences =
							item.recurrence?.totalRecurrences ?? 1;

						let panelContent;
						if (showPanel && item === showPanel.item) {
							if (showPanel.action === "edit") {
								panelContent = (
									<EditItemPanel
										item={item}
										onClose={() => {
											setShowPanel(undefined);
											updateItems();
										}}
									/>
								);
							}
						}

						let remainingDaysColor = "var(--color-green)";
						if (Math.abs(remainingDays) <= 3)
							remainingDaysColor = "var(--color-yellow)";
						else if (remainingDays < -3)
							remainingDaysColor = "var(--color-red)";

						return (
							<li
								key={item.id.value}
								onContextMenu={(e) => {
									e.preventDefault();
									setSelectedItem(item);
								}}
								style={{
									border: "none",
									width: "100%",
									textAlign: "left",
									padding: 0,
									cursor: "pointer",
								}}
							>
								<div className="two-columns-list">
									<span>
										{item.name.value}
										{item.recurrence?.frequency && (
											<span
												className="light-text"
												style={{
													paddingLeft: "6px",
												}}
											>
												{item.recurrence?.frequency.toString()}
											</span>
										)}
										<span
											className="light-text"
											style={{ paddingLeft: "6px" }}
										>
											{totalRecurrences > 0
												? `x${totalRecurrences}`
												: "∞"}
										</span>
										<br />
										<span
											style={{
												fontSize: "0.9em",
												marginLeft: "15px",
											}}
										>
											{recurrence!.date.toPrettyFormatDate()}
											<br />
											<span
												style={{
													marginLeft: "15px",
													color: remainingDaysColor,
												}}
											>
												{
													recurrence!.date
														.remainingDaysStr
												}
											</span>
										</span>
									</span>
									<span style={{ textAlign: "right" }}>
										<PriceLabel
											price={
												item.operation.isTransfer()
													? item.price
													: item.realPrice
											}
											operation={item.operation}
										/>
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
												onClick={() => {
													setAction("record");
													setSelectedItem(item);
												}}
											/>
										</span>
										<br />
										<div
											style={{ textAlign: "right" }}
											className="light-text"
										>
											<div>
												Per Month ≈{" "}
												{item.pricePerMonth.toString()}
											</div>
											<div>
												{account?.name.toString()}
												{toAccount
													? ` -> ${toAccount.name}`
													: undefined}
											</div>
										</div>
									</span>
								</div>
								{panelContent}
							</li>
						);
					})}{" "}
			</ul>
			<div
				style={{
					fontSize: "1.1em",
					textAlign: "right",
					marginTop: "10px",
				}}
			>
				<b>Total:</b>{" "}
				<span style={{ fontSize: "1.2em" }}>
					{itemsReport.getTotal().toString()}
				</span>
			</div>
			<div
				style={{
					textAlign: "right",
					marginTop: "10px",
				}}
			>
				<div>
					<b>Total Incomes Per Month ≈</b>{" "}
					<span style={{ fontSize: "1.2em" }}>
						{perMonthIncomes.toString()}
					</span>
				</div>
				<div>
					<b>Total Expenses Per Month ≈</b>{" "}
					<span style={{ fontSize: "1.2em" }}>
						{perMonthExpenses.toString()}
					</span>
				</div>
				<div>
					<b>Total Per Month ≈</b>{" "}
					<span style={{ fontSize: "1.2em" }}>
						{perMonth.toString()}
					</span>
				</div>
			</div>
		</div>
	);
};
