import { useContext, useEffect, useMemo, useState } from "react";
import { AccountsListContextMenu } from "./AccountsListContextMenu";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { Account } from "contexts/Accounts/domain";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "../Contexts";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels/CreateAccountPanel";
import {
	Checkbox,
	FormControlLabel,
	List,
	ListItem,
	Typography,
} from "@mui/material";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { DateValueObject } from "@juandardilag/value-objects";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const { updateTransactions } = useContext(TransactionsContext);
	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ItemsContext);

	const [selectedAccount, setSelectedAccount] = useState<Account>();

	const [showCreateForm, setShowCreateForm] = useState(false);

	const [project, setProject] = useState(false);
	const { date, DateInput } = useDateInput({
		initialValue: new Date(),
		label: "Date",
		lock: !project,
	});

	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);
	useEffect(() => {
		itemsWithAccumulatedBalanceUseCase
			.execute(new DateValueObject(date))
			.then(setItemsWithAccountsBalance);
	}, [date]);

	const accountsWithBalance = useMemo(
		() =>
			accounts.map((account) => {
				const newBalance = project
					? itemsWithAccountsBalance.findLast(
							({ recurrence: item }) =>
								item.account?.equalTo(account.id)
					  )?.accountBalance ?? account.balance
					: account.balance;
				account.updateBalance(newBalance);
				console.log({
					project,
					account: account.toPrimitives(),
					itemsWithAccountsBalance,
					newBalance: newBalance.value.value,
				});
				return account;
			}),
		[accounts, itemsWithAccountsBalance, project]
	);

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

			<FormControlLabel
				control={
					<Checkbox
						checked={project}
						onChange={(e) => {
							const checked = e.target.checked;
							setProject(checked);
						}}
					/>
				}
				label="Project"
			/>
			{DateInput}
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
				{accountsWithBalance
					.filter((acc) => acc.type.isAsset())
					.toSorted(
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
				{accountsWithBalance
					.filter((acc) => acc.type.isLiability())
					.toSorted(
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
