import { useLogger } from "apps/obsidian-plugin/hooks";
import { Item, ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { Forward } from "lucide-react";
import { useState, useEffect, useMemo, useContext } from "react";
import { AccountsContext, ItemsContext } from "../../Contexts";
import { AccountsReport, ItemsReport } from "contexts/Reports/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import { EditItemRecurrencePanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemRecurrencePanel";
import { PriceLabel } from "apps/obsidian-plugin/components/PriceLabel";
import { ItemReportContext } from "../../Contexts/ItemReportContext";
import { AccountBalance, AccountName } from "contexts/Accounts/domain";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";

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
											(recurrence.toAccount &&
												getAccountByID(
													recurrence.toAccount
												)?.name) ??
											AccountName.empty()
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
	item: Item;
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
	const logger = useLogger("CalendarItemsListItem");
	const remainingDays = recurrence.date.getRemainingDays();
	let remainingDaysColor = "";
	if (remainingDays < -3) remainingDaysColor = "var(--color-red)";
	else if (Math.abs(remainingDays) <= 3)
		remainingDaysColor = "var(--color-yellow)";
	else remainingDaysColor = "var(--color-green)";

	return (
		<div>
			<li
				onClick={() => {
					setShowPanel(undefined);
				}}
				onContextMenu={(e) => {
					e.preventDefault();
					setShowPanel(undefined);
					logger.debug("recurrence selected", { recurrence });
					setSelectedItem({ recurrence, itemID: item.id });
				}}
				onKeyDown={() => {}}
			>
				<div className="two-columns-list">
					<span>
						{item.name.value}{" "}
						<span className="light-text">
							{item.recurrence?.frequency?.value}
						</span>
						<br />
						<span
							style={{
								fontSize: "0.9em",
								marginLeft: "15px",
							}}
						>
							{recurrence.date.toPrettyFormatDate()}
							<br />
							<span
								style={{
									color: remainingDaysColor,
									marginLeft: "15px",
								}}
							>
								{recurrence.date.remainingDaysStr}
							</span>
						</span>
					</span>
					<span style={{ textAlign: "right" }}>
						<PriceLabel
							price={
								item.operation.type.isTransfer()
									? (recurrence.price ?? item.price).negate()
									: recurrence.price ?? item.price
							}
							operation={item.operation.type}
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
									setSelectedItem({
										recurrence,
										itemID: item.id,
									});
								}}
							/>
						</span>
						<br />
						<div
							style={{ textAlign: "right" }}
							className="light-text"
						>
							<div>{accountName.toString()}</div>
							<div>
								{accountPrevBalance.value.toString()} {"->"}{" "}
								{accountBalance.value.toString()}
							</div>
						</div>
					</span>
				</div>
			</li>
			{recurrence === showPanel?.item.recurrence &&
				showPanel.action === "record" && (
					<RecordItemPanel
						item={item}
						recurrence={{ recurrence, n }}
						onClose={() => {
							updateItems();
							setShowPanel(undefined);
							setAction(undefined);
						}}
					/>
				)}
			{recurrence === showPanel?.item.recurrence &&
				showPanel.action === "edit" && (
					<EditItemRecurrencePanel
						item={item}
						recurrence={{ recurrence, n }}
						onClose={() => {
							setShowPanel(undefined);
							setAction(undefined);
							updateItems();
						}}
					/>
				)}
		</div>
	);
};
