import { createContext } from "react";
import { AwilixContainer } from "awilix";
import { Account, AccountID, AccountName } from "contexts/Accounts/domain";
import { useAccounts } from "apps/obsidian-plugin/hooks";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";

export type AccountsContextType = {
	useCases: {
		getAllAccounts: GetAllAccountsUseCase;
		createAccount: CreateAccountUseCase;
	};
	accounts: Account[];
	updateAccounts: () => void;
	getAccountByID: (id: AccountID) => Account | undefined;
	getAccountByName: (name: AccountName) => Account | undefined;
};

export const AccountsContext = createContext<AccountsContextType>({
	useCases: {
		getAllAccounts: {} as GetAllAccountsUseCase,
		createAccount: {} as CreateAccountUseCase,
	},
	accounts: [],
	updateAccounts: () => {},
	getAccountByID: () => undefined,
	getAccountByName: () => undefined,
});

export const getAccountsContextValues = (
	container: AwilixContainer
): AccountsContextType => {
	const createAccount = container.resolve<CreateAccountUseCase>(
		"createAccountUseCase"
	);
	const getAllAccounts = container.resolve<GetAllAccountsUseCase>(
		"getAllAccountsUseCase"
	);

	const { accounts, updateAccounts, getAccountByID, getAccountByName } =
		useAccounts({
			getAllAccounts,
		});

	return {
		useCases: {
			createAccount,
			getAllAccounts,
		},
		accounts,
		updateAccounts,
		getAccountByID,
		getAccountByName,
	};
};
