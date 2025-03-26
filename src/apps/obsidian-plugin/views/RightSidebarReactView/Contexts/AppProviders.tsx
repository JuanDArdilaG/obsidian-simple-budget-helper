import {
	AppContext,
	ItemsContext,
	CategoriesContext,
	getCategoriesContextDefault,
	getItemsContextDefault,
	getAppContextDefault,
	TransactionsContext,
	getTransactionsContextValues,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { PropsWithChildren } from "react";
import { AwilixContainer } from "awilix";
import { AccountsContext, getAccountsContextValues } from "./AccountsContext";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";

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
			<ItemsContext.Provider value={getItemsContextDefault(container)}>
				<AccountsContext.Provider
					value={getAccountsContextValues(container)}
				>
					<CategoriesContext.Provider
						value={getCategoriesContextDefault(container)}
					>
						<TransactionsContext.Provider
							value={getTransactionsContextValues(container)}
						>
							{children}
						</TransactionsContext.Provider>
					</CategoriesContext.Provider>
				</AccountsContext.Provider>
			</ItemsContext.Provider>
		</AppContext.Provider>
	);
};
