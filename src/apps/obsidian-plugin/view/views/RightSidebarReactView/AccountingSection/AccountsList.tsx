import { useContext, useEffect, useState } from "react";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { AppContext } from "../RightSidebarReactView";
import { Logger } from "../../../../../../contexts/Shared/infrastructure/logger";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import {
	ItemCategory,
	ItemName,
	ItemOperation,
	ItemPrice,
	ItemSubcategory,
	SimpleItem,
} from "contexts/Items/domain";
import { Account, AccountID } from "contexts/Accounts/domain";
import { RecordSimpleItemUseCase } from "contexts/Transactions/application";
import { GetAllAccountsUseCase } from "contexts/Accounts/application";

export const AccountsList = () => {
	const { container, refresh } = useContext(AppContext);
	const recordSimpleItemUseCase = container.resolve(
		"recordSimpleItemUseCase"
	) as RecordSimpleItemUseCase;
	const getAllAccountsUseCase = container.resolve(
		"getAllAccountsUseCase"
	) as GetAllAccountsUseCase;

	const [selectedAccount, setSelectedAccount] = useState<Account>();
	const [accounts, setAccounts] = useState<Account[]>([]);
	useEffect(() => {
		getAllAccountsUseCase
			.execute()
			.then((accs) =>
				setAccounts(
					accs.sort(
						(a, b) => b.balance.valueOf() - a.balance.valueOf()
					)
				)
			);
	}, [getAllAccountsUseCase]);

	return (
		<RightSidebarReactTab title="Accounts" subtitle>
			{selectedAccount && (
				<AccountsListContextMenu
					account={selectedAccount}
					onAdjust={async (account: AccountID, newAmount: number) => {
						if (!newAmount) return;
						const adjustmentItem = SimpleItem.create(
							new ItemName(`Adjustment for ${account}`),
							new ItemPrice(Math.abs(newAmount)),
							new ItemOperation(
								newAmount > 0 ? "income" : "expense"
							),
							new ItemCategory("Adjustment"),
							new ItemSubcategory("Adjustment"),
							account
						);
						Logger.debug("adjusting account: " + account, {
							account,
							newAmount,
							adjustmentItem,
						});
						await recordSimpleItemUseCase.execute(adjustmentItem);
						await refresh();
					}}
				/>
			)}
			<ul>
				{accounts.map((account, i) => (
					<li
						key={i}
						onContextMenu={() => setSelectedAccount(account)}
					>
						{account.name.toString()}: {account.balance.toString()}
						<hr />
					</li>
				))}
			</ul>
			<div style={{ textAlign: "right" }}>
				Total:{" "}
				{/* {new PriceValueObject(
					budget.getHistory().getBalance({
						untilDate: new Date(),
					})
				).toString()} */}
			</div>
		</RightSidebarReactTab>
	);
};
