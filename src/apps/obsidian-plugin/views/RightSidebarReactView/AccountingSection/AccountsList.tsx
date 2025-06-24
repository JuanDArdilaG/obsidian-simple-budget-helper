import React, { useContext, useEffect, useMemo, useState } from "react";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AccountsContext, ItemsContext } from "../Contexts";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels/CreateAccountPanel";
import {
	Checkbox,
	FormControlLabel,
	List,
	ListItem,
	Typography,
	Box,
	Alert,
} from "@mui/material";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { DateValueObject } from "@juandardilag/value-objects";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { AccountsListItem } from "./AccountsListItem";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const report = useMemo(() => new AccountsReport(accounts), [accounts]);
	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ItemsContext);
	const [showCreateForm, setShowCreateForm] = useState(false);

	const [showProjectedBalances, setShowProjectedBalances] = useState(false);
	const { date, DateInput } = useDateInput({
		initialValue: new Date(),
		label: "Balance Date",
		lock: false, // Always allow date selection
	});

	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);
	
	const [isLoadingProjection, setIsLoadingProjection] = useState(false);

	// Load projected balances when date or projection toggle changes
	useEffect(() => {
		if (showProjectedBalances) {
			setIsLoadingProjection(true);
			itemsWithAccumulatedBalanceUseCase
				.execute(new DateValueObject(date))
				.then((result: ItemWithAccumulatedBalance[]) => {
					setItemsWithAccountsBalance(result);
					setIsLoadingProjection(false);
				})
				.catch(() => {
					setIsLoadingProjection(false);
				});
		} else {
			setItemsWithAccountsBalance([]);
		}
	}, [date, showProjectedBalances, itemsWithAccumulatedBalanceUseCase]);

	const accountsWithBalance = useMemo(
		() =>
			accounts.map((account) => {
				if (!showProjectedBalances) {
					return account; // Use current balance
				}

				// Find the latest balance for this account from projected items
				const latestProjectedBalance = itemsWithAccountsBalance.findLast(
					({ recurrence }: ItemWithAccumulatedBalance) =>
						recurrence.account?.equalTo(account.id)
				)?.accountBalance;

				if (latestProjectedBalance) {
					// Create a copy of the account with the projected balance
					const accountCopy = account.clone();
					accountCopy.updateBalance(latestProjectedBalance);
					return accountCopy;
				}

				return account; // Fallback to current balance
			}),
		[accounts, itemsWithAccountsBalance, showProjectedBalances]
	);

	const projectedReport = useMemo(() => new AccountsReport(accountsWithBalance), [accountsWithBalance]);

	const isProjectingToFuture = date > new Date();
	const isShowingCurrentBalances = !showProjectedBalances;

	return (
		<RightSidebarReactTab
			title="Accounts"
			handleCreate={async () => setShowCreateForm(!showCreateForm)}
			handleRefresh={async () => updateAccounts()}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<CreateAccountPanel
					onCreate={() => {
						updateAccounts();
						setShowCreateForm(false);
					}}
				/>
			)}

			<Box sx={{ mb: 2 }}>
				{DateInput}
				
				<FormControlLabel
					control={
						<Checkbox
							checked={showProjectedBalances}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								setShowProjectedBalances(e.target.checked);
							}}
							disabled={isLoadingProjection}
						/>
					}
					label={`Show balances as of ${date.toLocaleDateString()}`}
				/>

				{showProjectedBalances && isProjectingToFuture && (
					<Alert severity="info" sx={{ mt: 1, mb: 1 }}>
						Showing projected balances including scheduled items through {date.toLocaleDateString()}
					</Alert>
				)}

				{showProjectedBalances && !isProjectingToFuture && (
					<Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
						Showing historical balances as of {date.toLocaleDateString()}
					</Alert>
				)}

				{isLoadingProjection && (
					<Alert severity="info" sx={{ mt: 1, mb: 1 }}>
						Calculating projected balances...
					</Alert>
				)}
			</Box>

			<Typography variant="h4">
				Assets{" "}
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {projectedReport.getTotalForAssets().toString()}
					{showProjectedBalances && (
						<span style={{ fontStyle: "italic", marginLeft: "5px" }}>
							(as of {date.toLocaleDateString()})
						</span>
					)}
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
						<ListItem key={account.id.value}>
							<AccountsListItem account={account} />
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
					Total: {projectedReport.getTotalForLiabilites().toString()}
					{showProjectedBalances && (
						<span style={{ fontStyle: "italic", marginLeft: "5px" }}>
							(as of {date.toLocaleDateString()})
						</span>
					)}
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
						<ListItem key={account.id.value}>
							<AccountsListItem account={account} />
						</ListItem>
					))}
			</List>
			
			<br />
			<div>
				Total: {projectedReport.getTotal().toString()}
				{showProjectedBalances && (
					<span style={{ fontStyle: "italic", marginLeft: "5px" }}>
						(as of {date.toLocaleDateString()})
					</span>
				)}
			</div>
		</RightSidebarReactTab>
	);
};
