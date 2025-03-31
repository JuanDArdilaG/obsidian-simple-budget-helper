import { useLogger } from "apps/obsidian-plugin/hooks";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import {
	EditScheduledItemPanel,
	RecordScheduledItemPanel,
} from "apps/obsidian-plugin/panels";
import { AccountsContext } from "../../Contexts";
import { ScheduledItemsReport } from "contexts/Reports/domain";
import { GetScheduledItemsUntilDateUseCaseOutput } from "contexts/ScheduledItems/application/get-scheduled-items-until-date.usecase";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export const CalendarScheduledItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: GetScheduledItemsUntilDateUseCaseOutput;
	selectedItem?: ScheduledItem;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<ScheduledItem | undefined>
	>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("CalendarScheduledItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);

	const [showPanel, setShowPanel] = useState<{
		item: ScheduledItem;
		action?: "edit" | "record";
	}>();

	const itemsReport = useMemo(
		() => new ScheduledItemsReport(items.map((i) => i.item)),
		[items]
	);
	const withAccumulatedBalanceItems = useMemo(
		() => itemsReport.withAccumulatedBalance(accounts),
		[itemsReport, accounts]
	);

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

	// useEffect(() => {
	// 	if (!showPanel) {
	// 		if (action) setAction(undefined);
	// 	}
	// }, [setAction, showPanel]);

	return (
		<div>
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
													{item.date.remainingDaysStr}
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
										<RecordScheduledItemPanel
											item={item}
											onClose={() => {
												setShowPanel(undefined);
												setAction(undefined);
												updateItems();
											}}
										/>
									) : showPanel.action === "edit" ? (
										<EditScheduledItemPanel
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
									) : undefined
								) : undefined}
							</div>
						);
					}
				)}
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
