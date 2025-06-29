import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { EditItemRecurrencePanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemRecurrencePanel";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import { AccountBalance, AccountName } from "contexts/Accounts/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import {
	ItemID,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { AccountsReport } from "contexts/Reports/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
import { Forward } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { AccountsContext, ItemsContext } from "../../Contexts";
import { ItemReportContext } from "../../Contexts/ItemReportContext";

export const CalendarItemsList = ({
	items,
	untilDate,
	selectedItem,
	setSelectedItem,
	action,
	setAction,
	updateItems,
}: {
	items: GetItemsUntilDateUseCaseOutput;
	untilDate: Date;
	selectedItem?: {
		recurrence: ItemRecurrenceInfo;
		itemID: ItemID;
	};
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
			  }
			| undefined
		>
	>;
	action?: "edit" | "record";
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const logger = useLogger("CalendarItemsList");
	const { getAccountByID, accounts } = useContext(AccountsContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const totalAssets = useMemo(() => report.getTotalForAssets(), [report]);

	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ItemsContext);
	const {
		useCases: { getTotal },
	} = useContext(ItemReportContext);

	const [showPanel, setShowPanel] = useState<{
		item: {
			recurrence: ItemRecurrenceInfo;
			itemID: ItemID;
		};
		action?: "edit" | "record";
	}>();

	const itemsReport = useMemo(() => {
		const modifiedItems = items
			.map(({ recurrence, item }) => {
				item?.applyModification(recurrence);
				return item;
			})
			.filter((item) => !!item);
		logger.logger.debug("modifiedItems", { modifiedItems });
		return new ItemsReport(modifiedItems);
	}, [items]);
	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);

	useEffect(() => {
		itemsWithAccumulatedBalanceUseCase
			.execute(new DateValueObject(untilDate))
			.then((items) => setItemsWithAccountsBalance(items));
	}, [untilDate]);

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
			logger.debug("item selected for action.", {
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
					fontSize: "1.3em",
				}}
			>
				<div>
					<b>Total Incomes:</b>{" "}
					<span
						style={{
							color: "var(--color-green)",
						}}
					>
						{totalIncomes.toString()}
					</span>
				</div>
				<div>
					<b>Total Expenses:</b>{" "}
					<span style={{ color: "var(--color-red)" }}>
						{totalExpenses.toString()}
					</span>
				</div>
				<div>
					<b>{total.isNegative() ? "Deficit" : "Surplus"}:</b>{" "}
					<span>{total.toString()}</span>
				</div>
				<div>
					<b>Today Assets:</b> <span>{totalAssets.toString()}</span>
				</div>
				<div>
					<b>Balance:</b>{" "}
					<span>{totalAssets.plus(total).toString()}</span>
				</div>
			</div>
			<ul>
				{itemsWithAccountsBalance.map(
					(
						{
							item,
							n,
							recurrence,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
						},
						index
					) => (
						<div key={item.id.value + index}>
							<CalendarItemsListItem
								key={item.id.value + index}
								item={item}
								n={n}
								recurrence={recurrence}
								accountName={
									getAccountByID(
										recurrence.account ??
											item.operation.account
									)?.name ?? AccountName.empty()
								}
								accountBalance={accountBalance}
								accountPrevBalance={accountPrevBalance}
								showPanel={showPanel}
								setShowPanel={setShowPanel}
								setSelectedItem={setSelectedItem}
								setAction={setAction}
								updateItems={updateItems}
							/>
							{item.operation.type.isTransfer() &&
								toAccountBalance &&
								toAccountPrevBalance && (
									<CalendarItemsListItem
										key={
											item.id.value + index + "-transfer"
										}
										item={item}
										n={n}
										recurrence={recurrence}
										accountName={
											getAccountByID(
												recurrence.toAccount ??
													item.operation.toAccount!
											)?.name ?? AccountName.empty()
										}
										accountBalance={toAccountBalance}
										accountPrevBalance={
											toAccountPrevBalance
										}
										showPanel={showPanel}
										setShowPanel={setShowPanel}
										setSelectedItem={setSelectedItem}
										setAction={setAction}
										updateItems={updateItems}
									/>
								)}
						</div>
					)
				)}
			</ul>
			{showPanel && (
				<>
					{showPanel.action === "edit" &&
						(() => {
							const foundItem = items.find(
								(i) =>
									i.item.id.value ===
									showPanel.item.itemID.value
							);
							return foundItem ? (
								<EditItemRecurrencePanel
									item={foundItem.item}
									recurrence={{
										recurrence: showPanel.item.recurrence,
										n: new NumberValueObject(1),
									}}
									onClose={() => setShowPanel(undefined)}
								/>
							) : null;
						})()}
					{showPanel.action === "record" &&
						(() => {
							const foundItem = items.find(
								(i) =>
									i.item.id.value ===
									showPanel.item.itemID.value
							);
							return foundItem ? (
								<RecordItemPanel
									item={foundItem.item}
									recurrence={{
										recurrence: showPanel.item.recurrence,
										n: new NumberValueObject(1),
									}}
									onClose={() => setShowPanel(undefined)}
									updateItems={updateItems}
								/>
							) : null;
						})()}
				</>
			)}
		</div>
	);
};

const CalendarItemsListItem = ({
	item,
	n,
	recurrence,
	accountName,
	accountBalance,
	accountPrevBalance,
	showPanel,
	setShowPanel,
	setSelectedItem,
	setAction,
	updateItems,
}: {
	item: ScheduledItem;
	n: NumberValueObject;
	recurrence: ItemRecurrenceInfo;
	accountName: AccountName;
	accountBalance: AccountBalance;
	accountPrevBalance: AccountBalance;
	showPanel:
		| {
				item: {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
				};
				action?: "edit" | "record";
		  }
		| undefined;
	setShowPanel: React.Dispatch<
		React.SetStateAction<
			| {
					item: {
						recurrence: ItemRecurrenceInfo;
						itemID: ItemID;
					};
					action?: "edit" | "record";
			  }
			| undefined
		>
	>;
	setSelectedItem: React.Dispatch<
		React.SetStateAction<
			| {
					recurrence: ItemRecurrenceInfo;
					itemID: ItemID;
			  }
			| undefined
		>
	>;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	updateItems: () => void;
}) => {
	const getItemSplitPrice = (item: ScheduledItem): PriceValueObject => {
		const accountId = recurrence.account ?? item.operation.account;
		const split = item.fromSplits.find(
			(split) => split.accountId.value === accountId.value
		);
		return split
			? new PriceValueObject(split.amount.value)
			: PriceValueObject.zero();
	};

	const price = getItemSplitPrice(item);

	// --- AllItemsList style ---
	const totalRecurrences = item.recurrence?.totalRecurrences ?? 1;
	const frequency = item.recurrence?.frequency;
	const prettyDate = recurrence.date.toPrettyFormatDate();
	const remainingDays = recurrence.date.getRemainingDays() ?? 0;
	let remainingDaysColor = "var(--color-green)";
	if (Math.abs(remainingDays) <= 3)
		remainingDaysColor = "var(--color-yellow)";
	else if (remainingDays < -3) remainingDaysColor = "var(--color-red)";

	// Check if this item is currently selected for recording
	const isSelectedForRecord =
		showPanel?.action === "record" &&
		showPanel.item.itemID.value === item.id.value &&
		showPanel.item.recurrence.date.value.getTime() ===
			recurrence.date.value.getTime();

	return (
		<li
			style={{
				border: "none",
				width: "100%",
				textAlign: "left",
				padding: 0,
				cursor: "pointer",
				backgroundColor: isSelectedForRecord
					? "var(--background-modifier-hover)"
					: "transparent",
				borderRadius: "4px",
				marginBottom: "2px",
			}}
			onClick={() => {
				setSelectedItem({ recurrence, itemID: item.id });
				setAction("record");
			}}
			onContextMenu={(e) => {
				e.preventDefault();
				setSelectedItem({ recurrence, itemID: item.id });
				setAction("edit");
			}}
		>
			<div className="two-columns-list">
				<span>
					{item.name.toString()}
					{frequency && (
						<span
							className="light-text"
							style={{ paddingLeft: "6px" }}
						>
							{frequency.toString()}
						</span>
					)}
					<span className="light-text" style={{ paddingLeft: "6px" }}>
						{totalRecurrences > 0 ? `x${totalRecurrences}` : "∞"}
					</span>
					<br />
					<span style={{ fontSize: "0.9em", marginLeft: "15px" }}>
						{prettyDate}
						<br />
						<span
							style={{
								marginLeft: "15px",
								color: remainingDaysColor,
							}}
						>
							{recurrence.date.remainingDaysStr}
						</span>
					</span>
				</span>
				<span style={{ textAlign: "right" }}>
					<PriceLabel price={price} operation={item.operation.type} />
					<Forward
						style={{
							cursor: "pointer",
							color: "var(--color-green)",
						}}
						size={19}
					/>
					<br />
					<div style={{ textAlign: "right" }} className="light-text">
						<div>{accountName.toString()}</div>
					</div>
				</span>
			</div>
		</li>
	);
};
