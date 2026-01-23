import {
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
	Account,
	AccountAssetSubtype,
	AccountBalance,
	AccountLiabilitySubtype,
	AccountSubtype,
} from "../../../../../contexts/Accounts/domain";
import {
	currencies,
	Currency,
} from "../../../../../contexts/Currencies/domain";
import {
	AccountsReport,
	TransactionsReport,
} from "../../../../../contexts/Reports/domain";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { ConfirmationModal } from "../../../components/ConfirmationModal";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { AccountsContext, AppContext, TransactionsContext } from "../Contexts";
import { ExchangeRatesContext } from "../Contexts/ExchangeRatesContext";
import { AccountSection } from "./AccountSection";
import { DonutChart } from "./DonutChart";
import { SummaryCard } from "./SummaryCard";

export interface Summary {
	assets: number;
	liabilities: number;
	netWorth: number;
	assetsTrend: number;
	liabilitiesTrend: number;
	netWorthTrend: number;
}

export function AccountsDashboard() {
	const { plugin } = useContext(AppContext);
	const {
		accounts,
		updateAccounts,
		useCases: {
			changeAccountName,
			changeAccountSubtype,
			deleteAccount,
			createAccount,
			adjustAccount,
		},
	} = useContext(AccountsContext);
	const {
		useCases: { getExchangeRate },
	} = useContext(ExchangeRatesContext);
	const { transactions } = useContext(TransactionsContext);

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<string>();

	const [isAddingAccount, setIsAddingAccount] = useState<{
		type: "asset" | "liability";
	} | null>(null);
	const [newAccountCurrency, setNewAccountCurrency] = useState(
		plugin.settings.defaultCurrency,
	);

	const [accountsWithExchangeRates, setAccountsWithExchangeRates] = useState<
		Account[]
	>([]);

	useEffect(() => {
		const fetchExchangeRates = async () => {
			const updatedAccounts = await Promise.all(
				accounts.map(async (account) => {
					if (
						account.currency.value ===
						plugin.settings.defaultCurrency
					) {
						return account;
					}
					const exchangeRate = await getExchangeRate.execute({
						fromCurrency: account.currency,
						toCurrency: new Currency(
							plugin.settings.defaultCurrency,
						),
						date: account.updatedAt,
					});
					if (exchangeRate) {
						account.exchangeRate = exchangeRate;
					}
					return account;
				}),
			);
			setAccountsWithExchangeRates(updatedAccounts);
		};
		fetchExchangeRates();
	}, [accounts, getExchangeRate, plugin.settings.defaultCurrency]);

	const accountsReport = useMemo(() => {
		return new AccountsReport(accountsWithExchangeRates);
	}, [accountsWithExchangeRates]);
	const transactionsReport = useMemo(() => {
		return new TransactionsReport(transactions);
	}, [transactions]);

	const summary = useMemo(() => {
		const totalAssets = accountsReport.getTotalForAssets();
		const totalLiabilities = accountsReport.getTotalForLiabilities();
		const netWorth = accountsReport.getTotal();

		const now = new Date();
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(now.getDate() - 30);

		const lastMonthAssets = accountsReport.getTotalAssetsUntilDate(
			transactionsReport,
			thirtyDaysAgo,
		);
		const lastMonthLiabilities =
			accountsReport.getTotalLiabilitiesUntilDate(
				transactionsReport,
				thirtyDaysAgo,
			);
		const netWorthLastMonth = lastMonthAssets - lastMonthLiabilities;

		console.log("Last Month Assets:", lastMonthAssets);
		console.log("Last Month Liabilities:", lastMonthLiabilities);
		console.log("Net Worth Last Month:", netWorthLastMonth);

		const assetsTrend =
			((totalAssets - lastMonthAssets) / lastMonthAssets) * 100;
		const liabilitiesTrend =
			((totalLiabilities - lastMonthLiabilities) / lastMonthLiabilities) *
			100;
		const netWorthTrend =
			((netWorth - netWorthLastMonth) / netWorthLastMonth) * 100;

		return {
			assets: accountsReport.getTotalForAssets(),
			liabilities: accountsReport.getTotalForLiabilities(),
			netWorth: accountsReport.getTotal(),
			assetsTrend: Number.isFinite(assetsTrend) ? assetsTrend : 0,
			liabilitiesTrend: Number.isFinite(liabilitiesTrend)
				? liabilitiesTrend
				: 0,
			netWorthTrend: Number.isFinite(netWorthTrend) ? netWorthTrend : 0,
		};
	}, [accountsWithExchangeRates]);

	const handleUpdateAccount = async (
		id: Nanoid,
		updates: { name?: string; subtype?: AccountSubtype; amount?: number },
	) => {
		const account = accounts.find((a) => a.id.equalTo(id));

		await Promise.all([
			updates.name && account?.name.value !== updates.name
				? changeAccountName.execute({
						id,
						name: new StringValueObject(updates.name),
					})
				: Promise.resolve(),
			updates.subtype && account?.subtype !== updates.subtype
				? changeAccountSubtype.execute({
						id,
						subtype: updates.subtype,
					})
				: Promise.resolve(),
			updates.amount !== undefined &&
			account &&
			account.balance.value.value !== updates.amount
				? adjustAccount.execute({
						accountID: id,
						newBalance: new AccountBalance(
							new PriceValueObject(updates.amount),
						),
					})
				: Promise.resolve(),
		]);
	};

	const handleDeleteAccount = async (id: Nanoid) => {
		new ConfirmationModal(plugin.app, (confirmed) => {
			if (confirmed) {
				deleteAccount.execute(id);
			}
		}).open();
	};

	const handleAddAccountClick = (type: "asset" | "liability") => {
		setIsAddingAccount({
			type,
		});
		setNewAccountCurrency("USD");
	};

	const confirmAddAccount = async () => {
		if (!isAddingAccount) return;
		let newAccount: Account;
		if (isAddingAccount.type == "asset") {
			newAccount = Account.createAsset(
				AccountAssetSubtype.CASH,
				new StringValueObject("New Asset"),
				new Currency(newAccountCurrency),
			);
		} else {
			newAccount = Account.createLiability(
				AccountLiabilitySubtype.CREDIT_CARD,
				new StringValueObject("New Liability"),
				new Currency(newAccountCurrency),
			);
		}
		await createAccount.execute(newAccount);
	};

	const handleRefresh = () => {
		setIsRefreshing(true);
		setIsLoading(true);
		setTimeout(() => {
			updateAccounts();
			const lastUpdatedDate = new Date();
			setLastUpdated(
				lastUpdatedDate.toLocaleTimeString(undefined, {
					hour: "2-digit",
					minute: "2-digit",
				}),
			);
			setIsRefreshing(false);
			setIsLoading(false);
		}, 500); // To show the spinner for at least 500ms
	};

	useEffect(() => {
		handleRefresh();
	}, []);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 relative">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-end">
					<div className="flex items-center gap-4">
						<button
							onClick={handleRefresh}
							disabled={isRefreshing}
							className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
							aria-label="Refresh data"
						>
							<motion.div
								animate={{
									rotate: isRefreshing ? 360 : 0,
								}}
								transition={{
									duration: 1,
									repeat: isRefreshing ? Infinity : 0,
									ease: "linear",
								}}
							>
								<RefreshCw size={20} />
							</motion.div>
						</button>
						<div className="text-sm text-gray-500 hidden sm:block">
							Last updated: {lastUpdated}
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Top Section: Summary Cards & Chart */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
					{/* Summary Cards Column */}
					<div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
						<SummaryCard
							title="Total Assets"
							amount={summary.assets}
							trend={summary.assetsTrend}
							delay={0}
						/>
						<SummaryCard
							title="Total Liabilities"
							amount={summary.liabilities}
							trend={summary.liabilitiesTrend}
							delay={0.1}
						/>
						<SummaryCard
							title="Net Worth"
							amount={summary.netWorth}
							trend={summary.netWorthTrend}
							delay={0.2}
						/>
					</div>

					{/* Chart Column */}
					<div className="lg:col-span-1 h-64 lg:h-auto">
						<DonutChart
							assets={summary.assets}
							liabilities={summary.liabilities}
						/>
					</div>
				</div>

				{/* Bottom Section: Account Lists */}
				<div className="grid! grid-cols-1! lg:grid-cols-2! gap-8!">
					<motion.div
						initial={{
							opacity: 0,
							y: 20,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						transition={{
							duration: 0.5,
							delay: 0.3,
						}}
					>
						<AccountSection
							title="Assets"
							type="asset"
							accounts={accountsReport.getAssets()}
							onUpdate={handleUpdateAccount}
							onDelete={handleDeleteAccount}
							onAdd={handleAddAccountClick}
						/>
					</motion.div>

					<motion.div
						initial={{
							opacity: 0,
							y: 20,
						}}
						animate={{
							opacity: 1,
							y: 0,
						}}
						transition={{
							duration: 0.5,
							delay: 0.4,
						}}
					>
						<AccountSection
							title="Liabilities"
							type="liability"
							accounts={accountsReport.getLiabilities()}
							onUpdate={handleUpdateAccount}
							onDelete={handleDeleteAccount}
							onAdd={handleAddAccountClick}
						/>
					</motion.div>
				</div>
			</main>

			{/* Currency Selection Modal */}
			<AnimatePresence>
				{isAddingAccount && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
						<motion.div
							initial={{
								opacity: 0,
								scale: 0.95,
							}}
							animate={{
								opacity: 1,
								scale: 1,
							}}
							exit={{
								opacity: 0,
								scale: 0.95,
							}}
							className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-100"
						>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg! font-semibold! text-gray-900!">
									Add New{" "}
									{isAddingAccount.type === "asset"
										? "Asset"
										: "Liability"}
								</h3>
								<button
									onClick={() => setIsAddingAccount(null)}
									className="text-gray-400! hover:text-gray-600! transition-colors!"
								>
									<X size={20} />
								</button>
							</div>

							<div className="mb-6">
								<label
									htmlFor="currency-select"
									className="block text-sm! font-medium! text-gray-700! mb-2!"
								>
									Select Currency
								</label>
								<select
									id="currency-select"
									value={newAccountCurrency}
									onChange={(e) =>
										setNewAccountCurrency(e.target.value)
									}
									className="w-full! px-3! py-2! border! border-gray-300! rounded-lg! focus:outline-none! focus:ring-2! focus:ring-indigo-500! focus:border-indigo-500! bg-white!"
								>
									{Object.keys(currencies).map((code) => (
										<option key={code} value={code}>
											{currencies[code].name}
										</option>
									))}
								</select>
								<p className="mt-2 text-xs text-gray-500">
									Currency cannot be changed after creation.
								</p>
							</div>

							<div className="flex gap-3">
								<button
									onClick={() => setIsAddingAccount(null)}
									className="flex-1 px-4! py-2! border! border-gray-300! rounded-lg! text-gray-700! font-medium! hover:bg-gray-50 transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={confirmAddAccount}
									className="flex-1 px-4! py-2! bg-indigo-600! text-white! rounded-lg! font-medium! hover:bg-indigo-700 transition-colors"
								>
									Create Account
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}
