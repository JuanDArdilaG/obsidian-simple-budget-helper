import { useContext, useMemo, useState } from "react";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { Account } from "contexts/Accounts/domain";
import { AccountsContext, TransactionsContext } from "../Contexts";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels/CreateAccountPanel";
import { List, ListItem, Typography } from "@mui/material";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const { updateTransactions } = useContext(TransactionsContext);

	const [selectedAccount, setSelectedAccount] = useState<Account>();

	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<RightSidebarReactTab
			title="Accounts"
			handleCreate={async () => setShowCreateForm(!showCreateForm)}
			handleRefresh={async () => updateAccounts()}
			isCreating={showCreateForm}
		>
			{selectedAccount && (
				<AccountsListContextMenu
					account={selectedAccount}
					onAdjust={async () => {
						updateAccounts();
						updateTransactions();
					}}
				/>
			)}
			{showCreateForm && (
				<CreateAccountPanel
					onCreate={() => {
						updateAccounts();
						setShowCreateForm(false);
					}}
				/>
			)}
			<Typography variant="h4">
				Assets{" "}
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {report.getTotalForAssets().toString()}
				</span>
			</Typography>
			<List>
				{accounts
					.filter((acc) => acc.type.isAsset())
					.sort(
						(accA, accB) =>
							accB.balance.value.toNumber() -
							accA.balance.value.toNumber()
					)
					.map((account) => (
						<ListItem
							key={account.id.value}
							onContextMenu={() => setSelectedAccount(account)}
						>
							<Typography variant="body1">
								{account.name.toString()}:{" "}
								{account.balance.value.toString()}
							</Typography>
						</ListItem>
					))}
			</List>
			<Typography variant="h4">
				Liabilities{" "}
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {report.getTotalForLiabilites().toString()}
				</span>
			</Typography>
			<List>
				{accounts
					.filter((acc) => acc.type.isLiability())
					.sort(
						(accA, accB) =>
							accB.balance.value.toNumber() -
							accA.balance.value.toNumber()
					)
					.map((account) => (
						<ListItem
							key={account.id.value}
							onContextMenu={() => setSelectedAccount(account)}
						>
							<Typography variant="body1">
								{account.name.toString()}:{" "}
								{account.balance.value.toString()}
							</Typography>
						</ListItem>
					))}
			</List>
			<br />
			<div>Total: {report.getTotal().toString()}</div>
		</RightSidebarReactTab>
	);
};
