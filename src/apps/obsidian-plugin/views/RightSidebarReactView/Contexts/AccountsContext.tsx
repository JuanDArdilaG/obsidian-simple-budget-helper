import { createContext } from "react";
import { AwilixContainer } from "awilix";
import { CreateAccountUseCase, GetAllAccountsUseCase } from "contexts/Accounts";

export type AccountsContextType = {
	useCases: {
		getAllAccounts: GetAllAccountsUseCase;
		createAccount: CreateAccountUseCase;
	};
};

export const AccountsContext = createContext<AccountsContextType>({
	useCases: {
		getAllAccounts: {} as GetAllAccountsUseCase,
		createAccount: {} as CreateAccountUseCase,
	},
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

	return {
		useCases: {
			createAccount,
			getAllAccounts,
		},
	};
};
