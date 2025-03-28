import { useLogger } from "apps/obsidian-plugin/hooks";
import { RecurrentItem } from "contexts";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { RecordRecurrentItemPanel } from "../../../../panels/RecordRecurrentItemPanel";
import { EditRecurrentItemPanel } from "apps/obsidian-plugin/panels";
import { RecurrentItemsReport } from "contexts/Reports/domain/recurrent-items-report.entity";
import { AccountsContext } from "../../Contexts";

export const CalendarRecurrentItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: RecurrentItem[];
	selectedItem?: RecurrentItem;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<RecurrentItem | undefined>
	>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("CalendarRecurrentItemsList", false);
	const { getAccountByID, accounts } = useContext(AccountsContext);

	const itemsReport = useMemo(() => new RecurrentItemsReport(items), [items]);
	const [showPanel, setShowPanel] = useState<{
		item: RecurrentItem;
		action?: "edit" | "record";
	}>();

	useEffect(() => {
		if (selectedItem) {
			logger.debug("item selected for action", {
				selectedItem,
				action,
			});
			setShowPanel({ item: selectedItem, action });
		}
	}, [action, selectedItem]);

	useEffect(() => {
		if (!showPanel) {
			if (action) setAction(undefined);
		}
	}, [setAction, showPanel]);

	return (
		<div>
			<ul>
				{itemsReport
					.withAccumulatedBalance(accounts)
					.map(({ item, balance, prevBalance }, index) => {
						const account = getAccountByID(
							item.operation.isTransfer() &&
								item.toAccount &&
								item.price.isNegative()
								? item.toAccount
								: item.account
						);
						const remainingDays = item.nextDate.remainingDays;
						return (
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
											{item.name.value}{" "}
											<span className="light-text">
												{item.frequency?.value ??
													undefined}
											</span>
											<br />
											<span
												style={{
													fontSize: "0.9em",
													marginLeft: "15px",
												}}
											>
												{item.nextDate.toPrettyFormatDate()}
												<br />
												<span
													style={{
														color:
															remainingDays < -3
																? "var(--color-red)"
																: Math.abs(
																		remainingDays
																  ) <= 3
																? "var(--color-yellow)"
																: "var(--color-green)",
														marginLeft: "15px",
													}}
												>
													{
														item.nextDate
															.remainingDaysStr
													}
												</span>
											</span>
										</span>
										<span style={{ textAlign: "right" }}>
											{item.operation.isTransfer()
												? item.price.negate().toString()
												: item.realPrice.toString()}
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
											{/* {totalPerMonth ? <br /> : ""}
									{totalPerMonth
										? `Per Month ≈ ${new PriceValueObject(
												item.perMonthAmount
										  )}`
										: ""} */}
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
								{showPanel && item === showPanel.item ? (
									showPanel.action === "record" ? (
										<RecordRecurrentItemPanel
											item={item}
											onClose={() => {
												setShowPanel(undefined);
												updateItems();
											}}
										/>
									) : showPanel.action === "edit" ? (
										<EditRecurrentItemPanel
											item={item}
											onClose={() => {
												setShowPanel(undefined);
												updateItems();
											}}
										/>
									) : undefined
								) : undefined}
							</div>
						);
					})}
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
		</div>
	);
};
