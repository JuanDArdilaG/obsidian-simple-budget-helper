import {
	DateValueObject,
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import { List, ListSubheader } from "@mui/material";
import { ResponsiveScheduledItem } from "apps/obsidian-plugin/components/ResponsiveScheduledItem";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { EditItemRecurrencePanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/EditItemRecurrencePanel";
import { RecordItemPanel } from "apps/obsidian-plugin/panels/RecordItemPanel";
import {
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import {
	ItemID,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { AccountsReport } from "contexts/Reports/domain";
import { ItemsReport } from "contexts/Reports/domain/items-report.entity";
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
		} else {
			// Clear the panel when selectedItem is undefined
			setShowPanel(undefined);
		}
	}, [action, selectedItem]);

	// Define the accountTypeLookup function
	const accountTypeLookup = (id: AccountID): AccountType => {
		const account = getAccountByID(id);
		if (!account) return new AccountType("asset"); // fallback
		return account.type;
	};

	return (
		<div>
			<div
				style={{
					textAlign: "right",
					marginTop: 10,
					marginBottom: 10,
					fontSize: "1.3em",
					padding: "12px",
					backgroundColor: "var(--background-secondary)",
					borderRadius: "6px",
					border: "1px solid var(--background-modifier-border)",
				}}
			>
				{/* Scheduled Items Summary */}
				<div
					style={{
						marginBottom: "12px",
						paddingBottom: "8px",
						borderBottom:
							"1px solid var(--background-modifier-border)",
					}}
				>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Scheduled Items Summary
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Incomes:
						</span>
						<span
							style={{
								color: "var(--color-green)",
								fontWeight: "500",
							}}
						>
							{totalIncomes.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Expenses:
						</span>
						<span
							style={{
								color: "var(--color-red)",
								fontWeight: "500",
							}}
						>
							{totalExpenses.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							{total.isNegative() ? "Deficit" : "Surplus"}:
						</span>
						<span
							style={{
								fontWeight: "600",
								color: total.isNegative()
									? "var(--color-red)"
									: "var(--color-green)",
							}}
						>
							{total.toString()}
						</span>
					</div>
				</div>

				{/* Current Financial Position */}
				<div>
					<div
						style={{
							fontSize: "0.9em",
							color: "var(--text-muted)",
							marginBottom: "4px",
						}}
					>
						Current Financial Position
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "4px",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Current Assets:
						</span>
						<span style={{ fontWeight: "500" }}>
							{totalAssets.toString()}
						</span>
					</div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span
							style={{
								fontSize: "0.8em",
								color: "var(--text-muted)",
							}}
						>
							Projected Balance:
						</span>
						<span
							style={{
								fontWeight: "600",
								color: totalAssets.plus(total).isNegative()
									? "var(--color-red)"
									: "var(--color-green)",
							}}
						>
							{totalAssets.plus(total).toString()}
						</span>
					</div>
				</div>
			</div>
			{/* Group items by month */}
			{(() => {
				// Group items by month
				const itemsByMonth = itemsWithAccountsBalance.reduce(
					(
						groups,
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
					) => {
						const monthKey =
							recurrence.date.value.toLocaleDateString(
								"default",
								{
									year: "numeric",
									month: "long",
								}
							);

						if (!groups[monthKey]) {
							groups[monthKey] = [];
						}
						groups[monthKey].push({
							item,
							n,
							recurrence,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
							index,
						});
						return groups;
					},
					{} as Record<
						string,
						Array<{
							item: ScheduledItem;
							n: NumberValueObject;
							recurrence: ItemRecurrenceInfo;
							accountBalance: AccountBalance;
							accountPrevBalance: AccountBalance;
							toAccountBalance?: AccountBalance;
							toAccountPrevBalance?: AccountBalance;
							index: number;
						}>
					>
				);

				return Object.entries(itemsByMonth).map(
					([monthKey, monthItems]) => (
						<List key={monthKey} style={{ width: "100%" }}>
							<ListSubheader
								style={{
									backgroundColor:
										"var(--background-primary-alt)",
									color: "var(--text-normal)",
								}}
							>
								{monthKey}
							</ListSubheader>
							{monthItems.map(
								({
									item,
									n,
									recurrence,
									accountBalance,
									accountPrevBalance,
									toAccountBalance,
									toAccountPrevBalance,
									index,
								}) => (
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
											accountPrevBalance={
												accountPrevBalance
											}
											showPanel={showPanel}
											setShowPanel={setShowPanel}
											setSelectedItem={setSelectedItem}
											setAction={setAction}
											updateItems={updateItems}
											accountTypeLookup={
												accountTypeLookup
											}
										/>
										{item.operation.type.isTransfer() &&
											toAccountBalance &&
											toAccountPrevBalance && (
												<CalendarItemsListItem
													key={
														item.id.value +
														index +
														"-transfer"
													}
													item={item}
													n={n}
													recurrence={recurrence}
													accountName={
														getAccountByID(
															recurrence.toAccount ??
																item.operation
																	.toAccount!
														)?.name ??
														AccountName.empty()
													}
													accountBalance={
														toAccountBalance
													}
													accountPrevBalance={
														toAccountPrevBalance
													}
													showPanel={showPanel}
													setShowPanel={setShowPanel}
													setSelectedItem={
														setSelectedItem
													}
													setAction={setAction}
													updateItems={updateItems}
													accountTypeLookup={
														accountTypeLookup
													}
												/>
											)}
									</div>
								)
							)}
						</List>
					)
				);
			})()}
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
	accountTypeLookup,
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
	accountTypeLookup: (id: AccountID) => AccountType;
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

	// Check if this item is currently selected for recording
	const isSelectedForRecord =
		showPanel?.action === "record" &&
		showPanel.item.itemID.value === item.id.value &&
		showPanel.item.recurrence.date.value.getTime() ===
			recurrence.date.value.getTime();

	// Reusable responsive scheduled item component
	return (
		<>
			<ResponsiveScheduledItem
				item={item}
				recurrence={recurrence}
				accountName={accountName}
				accountBalance={accountBalance}
				accountPrevBalance={accountPrevBalance}
				price={price}
				isSelected={isSelectedForRecord}
				accountTypeLookup={accountTypeLookup}
				remainingDays={recurrence.date.getRemainingDays() ?? 0}
				setAction={setAction}
				setSelectedItem={setSelectedItem}
				context="calendar"
				currentAction={showPanel?.action}
			/>
			{showPanel &&
				showPanel.item.itemID.value === item.id.value &&
				showPanel.item.recurrence.date.value.getTime() ===
					recurrence.date.value.getTime() && (
					<>
						{showPanel.action === "edit" && (
							<EditItemRecurrencePanel
								item={item}
								recurrence={{
									recurrence: showPanel.item.recurrence,
									n: new NumberValueObject(1),
								}}
								onClose={() => setShowPanel(undefined)}
							/>
						)}
						{showPanel.action === "record" && (
							<RecordItemPanel
								item={item}
								recurrence={{
									recurrence: showPanel.item.recurrence,
									n: new NumberValueObject(1),
								}}
								onClose={() => setShowPanel(undefined)}
								updateItems={updateItems}
							/>
						)}
					</>
				)}
		</>
	);
};
