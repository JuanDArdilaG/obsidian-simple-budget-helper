import { useLogger } from "apps/obsidian-plugin/hooks";
import { RecurrentItem } from "contexts";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { RecordRecurrentItemPanel } from "../../../../panels/RecordRecurrentItemPanel";
import { EditRecurrentItemPanel } from "apps/obsidian-plugin/panels";
import { RecurrentItemsReport } from "contexts/Reports/domain/recurrent-items-report.entity";
import { AccountsContext } from "../../Contexts";

export const AllRecurrentItemsList = ({
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
	const logger = useLogger("AllRecurrentItemsList", false);
	const { getAccountByID } = useContext(AccountsContext);

	const itemsReport = useMemo(
		() => new RecurrentItemsReport(items).sortedByDate(),
		[items]
	);
	const [showPanel, setShowPanel] = useState<{
		item: RecurrentItem;
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
				{items.map((item, index) => {
					const account = getAccountByID(item.account);
					const toAccount = item.toAccount
						? getAccountByID(item.toAccount)
						: undefined;
					const remainingDays = item.nextDate.remainingDays;
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
										{item.name.value}{" "}
										<span className="light-text">
											{item.frequency?.value ?? undefined}
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
												{item.nextDate.remainingDaysStr}
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
