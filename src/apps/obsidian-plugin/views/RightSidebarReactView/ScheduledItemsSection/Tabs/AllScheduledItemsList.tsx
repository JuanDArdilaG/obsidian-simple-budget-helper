import { useLogger } from "apps/obsidian-plugin/hooks";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { RecordScheduledItemPanel } from "../../../../panels/RecordScheduledItemPanel";
import { EditScheduledItemPanel } from "apps/obsidian-plugin/panels";
import { ScheduledItemsReport } from "contexts/Reports/domain/scheduled-items-report.entity";
import { AccountsContext } from "../../Contexts";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";

export const AllScheduledItemsList = ({
	items,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: ScheduledItem[];
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
	const logger = useLogger("AllScheduledItemsList");
	const { getAccountByID } = useContext(AccountsContext);

	const itemsReport = useMemo(
		() => new ScheduledItemsReport(items).sortedByDate(),
		[items]
	);
	const [showPanel, setShowPanel] = useState<{
		item: ScheduledItem;
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

	return (
		<div>
			<ul>
				{items
					.sort((itemA, itemB) => itemA.date.compare(itemB.date))
					.map((item, index) => {
						const account = getAccountByID(item.account);
						const toAccount = item.toAccount
							? getAccountByID(item.toAccount)
							: undefined;
						const remainingDays = item.date.remainingDays;
						const totalRecurrences = item.totalRecurrences;
						return (
							<div key={index}>
								<li
									onClick={() => {
										setShowPanel(undefined);
									}}
									onContextMenu={(e) => {
										e.preventDefault();
										setSelectedItem(item);
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
													{item.recurrence.frequency.toString()}
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
												? item.price.toString()
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
								</li>
								{showPanel && item === showPanel.item ? (
									showPanel.action === "record" ? (
										<RecordScheduledItemPanel
											item={item}
											onClose={() => {
												setShowPanel(undefined);
												updateItems();
											}}
										/>
									) : showPanel.action === "edit" ? (
										<EditScheduledItemPanel
											recurrence={item}
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
			<div
				style={{
					textAlign: "right",
					marginTop: "10px",
				}}
			>
				<b>Total Per Month ≈</b>{" "}
				<span style={{ fontSize: "1.2em" }}>
					{itemsReport.getTotalPerMonth().toString()}
				</span>
			</div>
		</div>
	);
};
