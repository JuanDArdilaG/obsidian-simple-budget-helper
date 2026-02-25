import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import {
	AppContext,
	CategoriesContext,
	getAppContextDefault,
	getCategoriesContextDefault,
	getTransactionsContextValues,
	ScheduledTransactionsContext,
	TransactionsContext,
	useItemsContextDefault,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AwilixContainer } from "awilix";
import { PropsWithChildren } from "react";
import { AccountsContext, getAccountsContextValues } from "./AccountsContext";
import {
	ExchangeRatesContext,
	getExchangeRatesContext,
} from "./ExchangeRatesContext";

export const AppProviders = ({
	children,
	container,
	plugin,
}: PropsWithChildren<{
	container: AwilixContainer;
	plugin: SimpleBudgetHelperPlugin;
}>) => {
	return (
		<AppContext.Provider value={getAppContextDefault(container, plugin)}>
			<ScheduledTransactionsContext.Provider
				value={useItemsContextDefault(container)}
			>
				<AccountsContext.Provider
					value={getAccountsContextValues(container)}
				>
					<CategoriesContext.Provider
						value={getCategoriesContextDefault(container)}
					>
						<TransactionsContext.Provider
							value={getTransactionsContextValues(container)}
						>
							<ExchangeRatesContext.Provider
								value={getExchangeRatesContext(container)}
							>
								{children}
							</ExchangeRatesContext.Provider>
						</TransactionsContext.Provider>
					</CategoriesContext.Provider>
				</AccountsContext.Provider>
			</ScheduledTransactionsContext.Provider>
		</AppContext.Provider>
	);
};
