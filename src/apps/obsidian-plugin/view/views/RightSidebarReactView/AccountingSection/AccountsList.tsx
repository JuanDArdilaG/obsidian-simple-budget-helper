import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Budget } from "budget/Budget/Budget";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useContext, useEffect, useState } from "react";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { FileOperationsContext } from "../RightSidebarReactView";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { Logger } from "utils/logger";
import { RightSidebarReactTab } from "../RightSidebarReactTab";

export const AccountsList = ({ budget }: { budget: Budget<BudgetItem> }) => {
	const { itemOperations, refresh } = useContext(FileOperationsContext);
	const [selectedAccount, setSelectedAccount] = useState<string>();
	const [accounts, setAccounts] = useState<
		{ name: string; amount: number }[]
	>([]);
	useEffect(() => {
		setAccounts(
			Object.keys(BudgetHistory.fromBudget(budget).getAllByAccount())
				.map((account) => {
					return {
						name: account,
						amount: BudgetHistory.fromBudget(budget)
							.getAllByAccount()
							[account].getBalance({
								untilDate: new Date(),
								account,
							}),
					};
				})
				.sort((a, b) => b.amount - a.amount)
		);
	}, [budget]);

	return (
		<RightSidebarReactTab title="Accounts" subtitle>
			{selectedAccount && (
				<AccountsListContextMenu
					actualAmount={
						accounts.find(
							(account) => account.name === selectedAccount
						)?.amount ?? 0
					}
					account={selectedAccount}
					onAdjust={async (account: string, newAmount: number) => {
						if (!newAmount) return;
						const adjustTransaction = BudgetItemSimple.create(
							account,
							`Adjustment for ${account}`,
							Math.abs(newAmount),
							"Adjustment",
							"Adjustment",
							"",
							"",
							newAmount > 0 ? "income" : "expense",
							new Date()
						);
						Logger.debug("adjusting account: " + account, {
							account,
							newAmount,
							adjustTransaction,
						});
						await itemOperations(adjustTransaction, "add");
						await refresh();
					}}
				/>
			)}
			<ul>
				{accounts.map((account, i) => (
					<li
						key={i}
						onContextMenu={() => setSelectedAccount(account.name)}
					>
						{account.name}:{" "}
						{new PriceValueObject(account.amount).toString()}
						<hr />
					</li>
				))}
			</ul>
			<div style={{ textAlign: "right" }}>
				Total:{" "}
				{new PriceValueObject(
					budget.getHistory().getBalance({
						untilDate: new Date(),
					})
				).toString()}
			</div>
		</RightSidebarReactTab>
	);
};
