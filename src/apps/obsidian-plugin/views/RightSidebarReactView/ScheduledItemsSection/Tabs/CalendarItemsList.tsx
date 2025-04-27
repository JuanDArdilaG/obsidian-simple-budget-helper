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
import { AccountBalance, AccountName } from "contexts/Accounts/domain";

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
	const { accounts, getAccountByID } = useContext(AccountsContext);
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
	const itemsWithAccountsBalance = useMemo(
		() => itemsReport.execute(accounts),
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
				{itemsWithAccountsBalance.map(
					(
						{
							item,
							accountBalance,
							accountPrevBalance,
							toAccountBalance,
							toAccountPrevBalance,
						},
						index
					) => (
						<>
							<CalendarItemsListItem
								key={item.id.value + index}
								item={item}
								accountName={
									getAccountByID(item.account)?.name ??
									AccountName.empty()
								}
								accountBalance={accountBalance}
								accountPrevBalance={accountPrevBalance}
								showPanel={showPanel}
								setShowPanel={setShowPanel}
								setSelectedItem={setSelectedItem}
								setAction={setAction}
								items={items}
								updateItems={updateItems}
							/>
							{item.operation.isTransfer() &&
								toAccountBalance &&
								toAccountPrevBalance && (
									<CalendarItemsListItem
										key={
											item.id.value + index + "-transfer"
										}
										item={item}
										accountName={
											(item.toAccount &&
												getAccountByID(item.toAccount)
													?.name) ??
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
										items={items}
										updateItems={updateItems}
									/>
								)}
						</>
					)
				)}
			</ul>
		</div>
	);
};

const CalendarItemsListItem = ({
	item,
	accountName,
	accountBalance,
	accountPrevBalance,
	showPanel,
	setShowPanel,
	setSelectedItem,
	setAction,
	items,
	updateItems,
}: {
	item: Item;
	accountName: AccountName;
	accountBalance: AccountBalance;
	accountPrevBalance: AccountBalance;
	showPanel:
		| {
				item: Item;
				action?: "edit" | "record";
		  }
		| undefined;
	setShowPanel: React.Dispatch<
		React.SetStateAction<
			| {
					item: Item;
					action?: "edit" | "record";
			  }
			| undefined
		>
	>;
	setSelectedItem: React.Dispatch<React.SetStateAction<Item | undefined>>;
	setAction: React.Dispatch<
		React.SetStateAction<"edit" | "record" | undefined>
	>;
	items: GetItemsUntilDateUseCaseOutput;
	updateItems: () => void;
}) => {
	const remainingDays = item.date.remainingDays;
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
					setSelectedItem(item);
				}}
				onKeyDown={() => {}}
			>
				<div className="two-columns-list">
					<span>
						{item.name.value}{" "}
						<span className="light-text">
							{item.recurrence?.frequency.value ?? undefined}
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
							<div>{accountName.toString()}</div>
							<div>
								{accountPrevBalance.value.toString()} {"->"}{" "}
								{accountBalance.value.toString()}
							</div>
						</div>
					</span>
				</div>
			</li>
			{item === showPanel?.item && showPanel.action === "record" && (
				<RecordItemPanel
					item={item}
					onClose={() => {
						updateItems();
						setShowPanel(undefined);
						setAction(undefined);
					}}
				/>
			)}
			{item === showPanel?.item && showPanel.action === "edit" && (
				<EditItemPanel
					recurrence={
						items.find((r) => r.item === item) ?? {
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
};
