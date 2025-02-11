import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Budget } from "budget/Budget/Budget";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useContext, useEffect, useState } from "react";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { FileOperationsContext } from "../RightSidebarReactView";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { Logger } from "utils/logger";

export const AccountsList = ({ budget }: { budget: Budget<BudgetItem> }) => {
	const { itemOperations, refresh } = useContext(FileOperationsContext);
	const [selectedAccount, setSelectedAccount] = useState<string>();
	const [byAccount, setByAccount] = useState<Record<string, BudgetHistory>>(
		{}
	);
	useEffect(() => {
		setByAccount(BudgetHistory.fromBudget(budget).getAllByAccount());
	}, [budget]);

	return (
		<>
			{selectedAccount && (
				<AccountsListContextMenu
					actualAmount={byAccount[selectedAccount].getBalance({
						untilDate: new Date(),
						account: selectedAccount,
					})}
					account={selectedAccount}
					onAdjust={async (account: string, newAmount: number) => {
						if (!newAmount) return;
						const adjustTransaction = BudgetItemSimple.create(
							account,
							`Adjustment for ${account}`,
							Math.abs(newAmount),
							"Adjustment",
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
			<h2>Accounts</h2>
			<ul>
				{Object.keys(byAccount).map((account, i) => (
					<li
						key={i}
						onContextMenu={() => setSelectedAccount(account)}
					>
						{account}:{" "}
						{new PriceValueObject(
							byAccount[account].getBalance({
								untilDate: new Date(),
								account,
							})
						).toString()}
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
		</>
	);
};
