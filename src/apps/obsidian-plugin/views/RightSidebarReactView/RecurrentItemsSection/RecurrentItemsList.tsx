import { useLogger } from "apps/obsidian-plugin/hooks";
import { RecurrentItem, RecurrentItemNextDate } from "contexts";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { RecordRecurrentItemPanel } from "../../../panels/RecordRecurrentItemPanel";
import { EditRecurrentItemPanel } from "apps/obsidian-plugin/panels";
import { RecurrentItemsReport } from "contexts/Reports/domain/recurrent-items-report.entity";
import { AccountsContext, ItemsContext } from "../Contexts";
import { CalendarTimeframe } from "./TimeframeButtons";

export const RecurrentItemsList = ({
	timeframe,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
}: {
	timeframe: CalendarTimeframe;
	selectedItem?: RecurrentItem;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<RecurrentItem | undefined>
	>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
}) => {
	const logger = useLogger("RecurrentItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);

	const {
		useCases: { getRecurrentItemsUntilDate },
	} = useContext(ItemsContext);

	const [items, setItems] = useState<RecurrentItem[]>([]);
	const [updateItems, setUpdateItems] = useState(true);
	useEffect(() => {
		if (updateItems)
			getRecurrentItemsUntilDate
				.execute(
					RecurrentItemNextDate.now().addDays(
						timeframe === "year"
							? 365
							: timeframe === "3months"
							? 90
							: timeframe === "month"
							? 30
							: timeframe === "2weeks"
							? 14
							: timeframe === "week"
							? 7
							: 3
					)
				)
				.then((items) => {
					logger
						.debugB("getRecurrentItemsUntilDate", {
							timeframe,
							items,
						})
						.log();
					setItems(items);
				});
	}, [timeframe, updateItems]);
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
												{item.frequency.value}
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
															item.remainingDays
																.color === "red"
																? "var(--color-red)"
																: item
																		.remainingDays
																		.color ===
																  "yellow"
																? "var(--color-yellow)"
																: "var(--color-green)",
														marginLeft: "15px",
													}}
												>
													{item.remainingDays.str}
												</span>
											</span>
										</span>
										<span style={{ textAlign: "right" }}>
											{item.realPrice.toString()}
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
												setUpdateItems(true);
											}}
										/>
									) : showPanel.action === "edit" ? (
										<EditRecurrentItemPanel
											item={item}
											onClose={() => {
												setShowPanel(undefined);
												setUpdateItems(true);
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
