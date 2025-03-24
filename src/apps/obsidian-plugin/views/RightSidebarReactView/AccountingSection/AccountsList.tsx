import { useState } from "react";
import { ActionButtons } from "apps/obsidian-plugin/components";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { Account } from "contexts/Accounts/domain";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels";
import { useAccounts } from "apps/obsidian-plugin/hooks/useAccounts";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useAccounts();

	const [selectedAccount, setSelectedAccount] = useState<Account>();

	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<RightSidebarReactTab title="Accounts" subtitle>
			{selectedAccount && (
				<AccountsListContextMenu
					account={selectedAccount}
					onAdjust={async () => updateAccounts()}
				/>
			)}

			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateAccountPanel
					onCreate={() => {
						updateAccounts();
						setShowCreateForm(false);
					}}
				/>
			)}
			<h4>Assets</h4>
			<ul>
				{accounts
					.filter((acc) => acc.type.isAsset())
					.sort(
						(accA, accB) =>
							accB.balance.toNumber() - accA.balance.toNumber()
					)
					.map((account, i) => (
						<li
							key={i}
							onContextMenu={() => setSelectedAccount(account)}
						>
							{account.name.toString()}:{" "}
							{account.balance.toString()}
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
			<h4>Liabilities</h4>
			<ul>
				{accounts
					.filter((acc) => acc.type.isLiability())
					.sort(
						(accA, accB) =>
							accB.balance.toNumber() - accA.balance.toNumber()
					)
					.map((account, i) => (
						<li
							key={i}
							onContextMenu={() => setSelectedAccount(account)}
						>
							{account.name.toString()}:{" "}
							{account.balance.toString()}
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
