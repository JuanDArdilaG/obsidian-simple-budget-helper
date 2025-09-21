import { useAccounts } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DeleteAccountUseCase } from "contexts/Accounts/application/delete-account.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { Account, AccountID, AccountName } from "contexts/Accounts/domain";
import { createContext } from "react";

export type AccountsContextType = {
	useCases: {
		getAllAccounts: GetAllAccountsUseCase;
		createAccount: CreateAccountUseCase;
		deleteAccount: DeleteAccountUseCase;
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
		deleteAccount: {} as DeleteAccountUseCase,
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
	const deleteAccount = container.resolve<DeleteAccountUseCase>(
		"deleteAccountUseCase"
	);

	const { accounts, updateAccounts, getAccountByID, getAccountByName } =
		useAccounts({
			getAllAccounts,
		});

	return {
		useCases: {
			createAccount,
			getAllAccounts,
			deleteAccount,
		},
		accounts,
		updateAccounts,
		getAccountByID,
		getAccountByName,
	};
};
