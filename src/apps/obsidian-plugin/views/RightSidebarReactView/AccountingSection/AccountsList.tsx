import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { List, ListItem, Typography } from "@mui/material";
import { CreateAccountPanel } from "apps/obsidian-plugin/panels/CreateAccountPanel";
import { AccountsReport } from "contexts/Reports/domain/accounts-report.entity";
import { useContext, useEffect, useMemo, useState } from "react";
import {
	Account,
	AccountBalance,
} from "../../../../../contexts/Accounts/domain";
import { Currency } from "../../../../../contexts/Currencies/domain/currency.vo";
import { AccountsContext, AppContext } from "../Contexts";
import { ExchangeRatesContext } from "../Contexts/ExchangeRatesContext";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AccountsListItem } from "./AccountsListItem";

export const AccountsList = () => {
	const { plugin } = useContext(AppContext);
	const { accounts, updateAccounts } = useContext(AccountsContext);
	const {
		useCases: { getExchangeRate },
	} = useContext(ExchangeRatesContext);

	const [accountsWithConvertedBalances, setAccountsWithConvertedBalances] =
		useState(accounts);

	useEffect(() => {
		const fetchConvertedBalance = async () => {
			const accountsResponse: Account[] = [];
			for (const account of accounts) {
				if (
					account.currency.value === plugin.settings.defaultCurrency
				) {
					accountsResponse.push(account);
					continue;
				}

				const exchangeRate = await getExchangeRate.execute({
					fromCurrency: account.currency,
					toCurrency: new Currency(plugin.settings.defaultCurrency),
					date: DateValueObject.createNowDate(),
				});

				if (!exchangeRate) {
					accountsResponse.push(account);
					continue;
				}

				const convertedValue =
					exchangeRate.rate.value * account.balance.value.value;

				account.defaultCurrencyBalance = new AccountBalance(
					new PriceValueObject(convertedValue)
				);

				accountsResponse.push(account);
			}
			setAccountsWithConvertedBalances(accountsResponse);
		};

		fetchConvertedBalance();
	}, [accounts, getExchangeRate, plugin.settings.defaultCurrency]);

	const [showCreateForm, setShowCreateForm] = useState(false);

	const accountsReport = useMemo(
		() => new AccountsReport(accountsWithConvertedBalances),
		[accountsWithConvertedBalances]
	);
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

			<Typography variant="h4">
				Assets{" "}
				<span
					style={{
						fontSize: "0.7em",
						fontWeight: "normal",
						paddingLeft: "5px",
					}}
				>
					Total: {accountsReport.getTotalForAssets().toString()}
				</span>
			</Typography>
			<List>
				{accountsWithConvertedBalances
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

			<Typography variant="h4">Liabilities </Typography>
			<List>
				{accounts
					.filter((acc) => acc.type.isLiability())
					.toSorted(
						(accA, accB) =>
							(
								accB.defaultCurrencyBalance?.value ??
								accB.balance.value
							).toNumber() -
							(
								accA.defaultCurrencyBalance?.value ??
								accA.balance.value
							).toNumber()
					)
					.map((account) => (
						<ListItem key={account.id.value}>
							<AccountsListItem account={account} />
						</ListItem>
					))}
			</List>

			<br />
			<div>Total: {accountsReport.getTotal().toString()}</div>
		</RightSidebarReactTab>
	);
};
