import { useContext, useMemo, useState } from "react";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { Account } from "contexts/Accounts/domain";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels";
import { AccountsContext, TransactionsContext } from "../Contexts";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const { updateTransactions } = useContext(TransactionsContext);

	const [selectedAccount, setSelectedAccount] = useState<Account>();

	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<RightSidebarReactTab title="Accounts" subtitle>
			{selectedAccount && (
				<AccountsListContextMenu
					account={selectedAccount}
					onAdjust={async () => {
						updateAccounts();
						updateTransactions();
					}}
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
			<h4>
				Assets
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {report.getTotalForAssets().toString()}
				</span>
			</h4>
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
			<h4>
				Liabilities
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {report.getTotalForLiabilites().toString()}
				</span>
			</h4>
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
			<br />
			<div>Total: {report.getTotal().toString()}</div>
		</RightSidebarReactTab>
	);
};
