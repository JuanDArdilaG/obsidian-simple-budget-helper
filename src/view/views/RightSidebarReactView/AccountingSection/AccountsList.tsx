import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { Budget } from "budget/Budget/Budget";
import { BudgetHistory } from "budget/Budget/BudgetHistory";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { useEffect, useState } from "react";

export const AccountsList = ({ budget }: { budget: Budget<BudgetItem> }) => {
	const [byAccount, setByAccount] = useState<Record<string, BudgetHistory>>(
		{}
	);
	useEffect(() => {
		setByAccount(BudgetHistory.fromBudget(budget).getAllByAccount());
	}, [budget]);

	return (
		<>
			<h2>Accounts</h2>
			{Object.keys(byAccount).map((account, i) => (
				<div key={i}>
					{account}:{" "}
					{new PriceValueObject(
						byAccount[account].getBalance({
							untilDate: new Date(),
							account,
						})
					).toString()}
				</div>
			))}
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
