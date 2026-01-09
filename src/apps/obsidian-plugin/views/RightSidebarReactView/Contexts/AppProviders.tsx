import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
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
	getItemReportContextValues,
	ItemReportContext,
} from "./ItemReportContext";

export const AppProviders = ({
	children,
	container,
	plugin,
}: PropsWithChildren<{
	container: AwilixContainer;
	plugin: SimpleBudgetHelperPlugin;
}>) => {
	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<AppContext.Provider
				value={getAppContextDefault(container, plugin)}
			>
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
								<ItemReportContext.Provider
									value={getItemReportContextValues(
										container
									)}
								>
									{children}
								</ItemReportContext.Provider>
							</TransactionsContext.Provider>
						</CategoriesContext.Provider>
					</AccountsContext.Provider>
				</ScheduledTransactionsContext.Provider>
			</AppContext.Provider>
		</LocalizationProvider>
	);
};
