import { DateValueObject } from "@juandardilag/value-objects";
import {
	Alert,
	Box,
	Checkbox,
	FormControlLabel,
	List,
	ListItem,
	Typography,
} from "@mui/material";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels/CreateAccountPanel";
import { Account } from "contexts/Accounts/domain";
import { ItemWithAccumulatedBalance } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AccountsContext, ItemsContext } from "../Contexts";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AccountsListItem } from "./AccountsListItem";

export const AccountsList = () => {
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const {
		useCases: { itemsWithAccumulatedBalanceUseCase },
	} = useContext(ItemsContext);
	const [showCreateForm, setShowCreateForm] = useState(false);

	const [showProjectedBalances, setShowProjectedBalances] = useState(false);
	const { date, DateInput, setDate } = useDateInput({
		initialValue: new Date(),
		label: "Balance Date",
		lock: false, // Always allow date selection
		withTime: false, // Hide time selection
	});

	const [itemsWithAccountsBalance, setItemsWithAccountsBalance] = useState<
		ItemWithAccumulatedBalance[]
	>([]);

	const [isLoadingProjection, setIsLoadingProjection] = useState(false);

	// Set the time to 23:59:59 whenever the date changes
	useEffect(() => {
		const dateWithEndTime = new Date(date);
		dateWithEndTime.setHours(23, 59, 59, 999);
		if (dateWithEndTime.getTime() !== date.getTime()) {
			setDate(dateWithEndTime);
		}
	}, [date, setDate]);

	// Helper function to calculate the impact of a transaction on a specific account
	const calculateTransactionImpact = (
		item: ItemWithAccumulatedBalance,
		account: Account
	) => {
		const { recurrence, item: originalItem } = item;

		// Get the real price for this account from the recurrence
		const impact = recurrence.getRealPriceForAccount(
			originalItem.operation,
			account,
			originalItem.fromAmount,
			originalItem.fromSplits[0]?.accountId,
			originalItem.toSplits[0]?.accountId
		);

		return impact;
	};

	// Load projected balances when date or projection toggle changes
	useEffect(() => {
		if (showProjectedBalances) {
			setIsLoadingProjection(true);
			itemsWithAccumulatedBalanceUseCase
				.execute(new DateValueObject(date))
				.then((result: ItemWithAccumulatedBalance[]) => {
					console.log("Projected balances result:", {
						totalItems: result.length,
						items: result.map((item) => ({
							itemName: item.item.name.toString(),
							date: item.recurrence.date.toString(),
							state: item.recurrence.state,
							accountBalance:
								item.accountBalance.value.toString(),
							account: item.recurrence.fromSplits?.[0]?.accountId,
							itemOperationAccount:
								item.item.fromSplits[0]?.accountId,
							itemOperationToAccount:
								item.item.toSplits[0]?.accountId,
						})),
					});
					setItemsWithAccountsBalance(result);
					setIsLoadingProjection(false);
				})
				.catch((error) => {
					console.error(
						"Error calculating projected balances:",
						error
					);
					setIsLoadingProjection(false);
				});
		} else {
			setItemsWithAccountsBalance([]);
		}
	}, [date, showProjectedBalances, itemsWithAccumulatedBalanceUseCase]);

	const accountsWithBalance = useMemo(() => {
		console.log("Calculating accountsWithBalance:", {
			showProjectedBalances,
			itemsWithAccountsBalance: itemsWithAccountsBalance.length,
			accounts: accounts.length,
		});

		return accounts.map((account) => {
			if (!showProjectedBalances) {
				return account; // Use current balance
			}

			// Find all items that affect this account
			const accountItems = itemsWithAccountsBalance.filter(
				({ recurrence, item }: ItemWithAccumulatedBalance) => {
					// Check if this account is involved in the transaction
					const isMainAccount =
						recurrence.fromSplits?.[0]?.accountId?.equalTo(
							account.id
						) || item.fromSplits[0]?.accountId?.equalTo(account.id);
					const isToAccount = item.toSplits[0]?.accountId?.equalTo(
						account.id
					);

					return isMainAccount || isToAccount;
				}
			);

			console.log(`Account ${account.name.toString()}:`, {
				originalBalance: account.balance.value.toString(),
				accountItemsCount: accountItems.length,
				accountItems: accountItems.map((itemWithBalance) => ({
					itemName: itemWithBalance.item.name.toString(),
					accountBalance:
						itemWithBalance.accountBalance.value.toString(),
					date: itemWithBalance.recurrence.date.toString(),
					isMainAccount:
						itemWithBalance.recurrence.fromSplits?.[0]?.accountId?.equalTo(
							account.id
						) ||
						itemWithBalance.item.fromSplits[0]?.accountId?.equalTo(
							account.id
						),
					isToAccount:
						itemWithBalance.item.toSplits[0]?.accountId?.equalTo(
							account.id
						),
				})),
			});

			// Calculate the projected balance by processing transactions chronologically
			let projectedBalance = account.balance; // Start with current balance

			if (accountItems.length > 0) {
				// Sort items by date to ensure chronological order
				const sortedItems = accountItems.sort((a, b) =>
					a.recurrence.date.compareTo(b.recurrence.date)
				);

				// Process each transaction chronologically
				for (const item of sortedItems) {
					// Calculate the impact of this transaction on the account
					const impact = calculateTransactionImpact(item, account);
					const previousBalance = projectedBalance;
					projectedBalance = projectedBalance.plus(impact);

					console.log(
						`Transaction ${item.item.name.toString()} on ${item.recurrence.date.toString()}:`,
						{
							previousBalance: previousBalance.value.toString(),
							impact: impact.value.toString(),
							newBalance: projectedBalance.value.toString(),
						}
					);
				}

				console.log(
					`Account ${account.name.toString()} final projected balance:`,
					projectedBalance.value.toString()
				);
			}

			if (accountItems.length > 0) {
				// Create a copy of the account with the projected balance
				const accountCopy = account.copy();
				accountCopy.updateBalance(projectedBalance);
				console.log(
					`Updated ${account.name.toString()} balance to:`,
					projectedBalance.value.toString()
				);
				return accountCopy;
			}

			console.log(
				`No projected balance found for ${account.name.toString()}, using current balance`
			);
			return account; // Fallback to current balance
		});
	}, [accounts, itemsWithAccountsBalance, showProjectedBalances]);

	const projectedReport = useMemo(
		() => new AccountsReport(accountsWithBalance),
		[accountsWithBalance]
	);

	const isProjectingToFuture = date > new Date();

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
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>
							) => {
								setShowProjectedBalances(e.target.checked);
							}}
							disabled={isLoadingProjection}
						/>
					}
					label={`Show balances as of ${date.toLocaleDateString()}`}
				/>

				{showProjectedBalances && isProjectingToFuture && (
					<Alert severity="info" sx={{ mt: 1, mb: 1 }}>
						Showing projected balances including scheduled items
						through {date.toLocaleDateString()}
					</Alert>
				)}

				{showProjectedBalances && !isProjectingToFuture && (
					<Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
						Showing historical balances as of{" "}
						{date.toLocaleDateString()}
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
						<span
							style={{ fontStyle: "italic", marginLeft: "5px" }}
						>
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
						<span
							style={{ fontStyle: "italic", marginLeft: "5px" }}
						>
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
