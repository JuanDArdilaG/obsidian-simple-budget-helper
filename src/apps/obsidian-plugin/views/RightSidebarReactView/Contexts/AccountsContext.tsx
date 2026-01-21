import { useAccounts } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DeleteAccountUseCase } from "contexts/Accounts/application/delete-account.usecase";
import { GetAllAccountsUseCase } from "contexts/Accounts/application/get-all-accounts.usecase";
import { Account, AccountName } from "contexts/Accounts/domain";
import { createContext } from "react";
import { ChangeAccountNameUseCase } from "../../../../../contexts/Accounts/application/change-account-name.usecase";
import { ChangeAccountSubtypeUseCase } from "../../../../../contexts/Accounts/application/change-account-subtype.usecase";
import { Nanoid } from "../../../../../contexts/Shared/domain";
import { AdjustAccountUseCase } from "../../../../../contexts/Transactions/application/adjust-account.usecase";

export type AccountsContextType = {
	useCases: {
		getAllAccounts: GetAllAccountsUseCase;
		createAccount: CreateAccountUseCase;
		deleteAccount: DeleteAccountUseCase;
		changeAccountName: ChangeAccountNameUseCase;
		changeAccountSubtype: ChangeAccountSubtypeUseCase;
		adjustAccount: AdjustAccountUseCase;
	};
	accounts: Account[];
	updateAccounts: () => void;
	getAccountByID: (id: Nanoid) => Account | undefined;
	getAccountByName: (name: AccountName) => Account | undefined;
};

export const AccountsContext = createContext<AccountsContextType>({
	useCases: {
		getAllAccounts: {} as GetAllAccountsUseCase,
		createAccount: {} as CreateAccountUseCase,
		deleteAccount: {} as DeleteAccountUseCase,
		changeAccountName: {} as ChangeAccountNameUseCase,
		changeAccountSubtype: {} as ChangeAccountSubtypeUseCase,
		adjustAccount: {} as AdjustAccountUseCase,
	},
	accounts: [],
	updateAccounts: () => {},
	getAccountByID: () => undefined,
	getAccountByName: () => undefined,
});

export const getAccountsContextValues = (
	container: AwilixContainer,
): AccountsContextType => {
	const createAccount = container.resolve<CreateAccountUseCase>(
		"createAccountUseCase",
	);
	const getAllAccounts = container.resolve<GetAllAccountsUseCase>(
		"getAllAccountsUseCase",
	);
	const deleteAccount = container.resolve<DeleteAccountUseCase>(
		"deleteAccountUseCase",
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
			changeAccountName: container.resolve<ChangeAccountNameUseCase>(
				"changeAccountNameUseCase",
			),
			changeAccountSubtype:
				container.resolve<ChangeAccountSubtypeUseCase>(
					"changeAccountSubtypeUseCase",
				),
			adjustAccount: container.resolve<AdjustAccountUseCase>(
				"adjustAccountUseCase",
			),
		},
		accounts,
		updateAccounts,
		getAccountByID,
		getAccountByName,
	};
};
