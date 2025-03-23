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

export const AppProviders = ({
	children,
	container,
}: PropsWithChildren<{ container: AwilixContainer }>) => {
	return (
		<AppContext.Provider value={getAppContextDefault(container)}>
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
