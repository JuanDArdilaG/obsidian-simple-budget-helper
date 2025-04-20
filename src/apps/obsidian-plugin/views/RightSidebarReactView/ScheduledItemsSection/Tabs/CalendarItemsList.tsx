import { useLogger } from "apps/obsidian-plugin/hooks";
import { Item } from "contexts/Items/domain";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { AccountsContext } from "../../Contexts";
import { ItemsReport } from "contexts/Reports/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { NumberValueObject } from "@juandardilag/value-objects";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import { EditItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemPanel";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { ItemReportContext } from "../../Contexts/ItemReportContext";

export const CalendarItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: GetItemsUntilDateUseCaseOutput;
	selectedItem?: Item;
	setSelectedItem: React.Dispatch<React.SetStateAction<Item | undefined>>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("CalendarItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);
	const {
		useCases: { getTotal },
	} = useContext(ItemReportContext);

	const [showPanel, setShowPanel] = useState<{
		item: Item;
		action?: "edit" | "record";
	}>();

	const itemsReport = useMemo(
		() => new ItemsReport(items.map((i) => i.item)),
		[items]
	);
	const withAccumulatedBalanceItems = useMemo(
		() => itemsReport.withAccumulatedBalance(accounts),
		[itemsReport, accounts]
	);

	const [total, setTotal] = useState(NumberValueObject.zero());
	useEffect(() => {
		getTotal.execute({ report: itemsReport }).then(setTotal);
	}, [getTotal, itemsReport]);

	const [totalExpenses, setTotalExpenses] = useState(
		NumberValueObject.zero()
	);
	useEffect(() => {
		getTotal
			.execute({ report: itemsReport, type: "expenses" })
			.then(setTotalExpenses);
	}, [getTotal, itemsReport]);

	const [totalIncomes, setTotalIncomes] = useState(NumberValueObject.zero());
	useEffect(() => {
		getTotal
			.execute({ report: itemsReport, type: "incomes" })
			.then(setTotalIncomes);
	}, [getTotal, itemsReport]);

	useEffect(() => {
		if (selectedItem) {
			logger.debug("item selected for action", {
				selectedItem,
				action,
				showPanel,
			});
			setShowPanel({ item: selectedItem, action });
		}
	}, [action, selectedItem]);

	return (
		<div>
			<div
				style={{
					textAlign: "right",
					marginTop: 10,
					marginBottom: 10,
				}}
			>
				<div>
					<b>Total Incomes:</b>{" "}
					<span
						style={{
							fontSize: "1.2em",
							color: "var(--color-green)",
						}}
					>
						{totalIncomes.toString()}
					</span>
				</div>
				<div>
					<b>Total Expenses:</b>{" "}
					<span
						style={{ fontSize: "1.2em", color: "var(--color-red)" }}
					>
						{totalExpenses.toString()}
					</span>
				</div>
				<div>
					<b>Total:</b>{" "}
					<span style={{ fontSize: "1.2em" }}>
						{total.toString()}
					</span>
				</div>
			</div>
			<ul>
				{withAccumulatedBalanceItems.map(
					({ item, balance, prevBalance }, index) => {
						const account = getAccountByID(
							item.operation.isTransfer() &&
								item.toAccount &&
								item.price.isNegative()
								? item.toAccount
								: item.account
						);
						const remainingDays = item.date.remainingDays;

						let remainingDaysColor = "";
						if (remainingDays < -3)
							remainingDaysColor = "var(--color-red)";
						else if (Math.abs(remainingDays) <= 3)
							remainingDaysColor = "var(--color-yellow)";
						else remainingDaysColor = "var(--color-green)";

						return (
							<div key={`${item.id.value}-${index}`}>
								<li
									onClick={() => {
										setShowPanel(undefined);
									}}
									onContextMenu={(e) => {
										e.preventDefault();
										setShowPanel(undefined);
										setSelectedItem(item);
									}}
									onKeyDown={() => {}}
								>
									<div className="two-columns-list">
										<span>
											{item.name.value}{" "}
											<span className="light-text">
												{item.recurrence?.frequency
													.value ?? undefined}
											</span>
											<br />
											<span
												style={{
													fontSize: "0.9em",
													marginLeft: "15px",
												}}
											>
												{item.date.toPrettyFormatDate()}
												<br />
												<span
													style={{
														color: remainingDaysColor,
														marginLeft: "15px",
													}}
												>
													{item.date.remainingDaysStr}
												</span>
											</span>
										</span>
										<span style={{ textAlign: "right" }}>
											<PriceLabel
												price={
													item.operation.isTransfer()
														? item.price.negate()
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
													{account?.name.toString()}
												</div>
												<div>
													{prevBalance.toString()}{" "}
													{"->"} {balance.toString()}
												</div>
											</div>
										</span>
									</div>
								</li>
								{item === showPanel?.item &&
									showPanel.action === "record" && (
										<RecordItemPanel
											item={item}
											onClose={() => {
												updateItems();
												setShowPanel(undefined);
												setAction(undefined);
											}}
										/>
									)}
								{item === showPanel?.item &&
									showPanel.action === "edit" && (
										<EditItemPanel
											recurrence={
												items.find(
													(r) => r.item === item
												) ?? {
													item,
													n: NumberValueObject.zero(),
												}
											}
											onClose={() => {
												setShowPanel(undefined);
												setAction(undefined);
												updateItems();
											}}
										/>
									)}
							</div>
						);
					}
				)}
			</ul>
		</div>
	);
};
