import { useAccounts } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateAccountUseCase } from "contexts/Accounts/application/create-account.usecase";
import { DeleteAccountUseCase } from "contexts/Accounts/application/delete-account.usecase";
import {
	AccountsMap,
	GetAllAccountsUseCase,
} from "contexts/Accounts/application/get-all-accounts.usecase";
import { Account } from "contexts/Accounts/domain";
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
	accountsMap: AccountsMap;
	updateAccounts: () => void;
	getAccountByID: (id: Nanoid) => Account | null;
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
	accountsMap: new Map(),
	updateAccounts: () => {},
	getAccountByID: () => null,
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

	const { accountsMap, updateAccounts, getAccountByID } = useAccounts({
		getAllAccounts,
	});

	console.log("[AccountsContext] Context value created", {
		accountCount: accountsMap.size,
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
		accountsMap,
		updateAccounts,
		getAccountByID,
	};
};
