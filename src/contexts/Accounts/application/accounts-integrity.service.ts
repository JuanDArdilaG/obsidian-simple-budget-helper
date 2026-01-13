import {
	NumberValueObject,
	PriceValueObject,
} from "@juandardilag/value-objects";
import {
	Account,
	AccountBalance,
	AccountID,
	AccountIntegrityResult,
	IAccountsIntegrityService,
	IAccountsRepository,
	IntegrityCheckReport,
} from "contexts/Accounts/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsRepository,
	Transaction,
} from "contexts/Transactions/domain";

export class AccountsIntegrityService implements IAccountsIntegrityService {
	private readonly _logger = new Logger("AccountsIntegrityService");

	constructor(
		private readonly _accountsRepository: IAccountsRepository,
		private readonly _transactionsRepository: ITransactionsRepository
	) {}

	async calculateAccountIntegrity(
		accountId: AccountID
	): Promise<AccountIntegrityResult> {
		this._logger.debug("Calculating integrity for account", {
			accountId: accountId.value,
		});

		// Get the account
		const account = await this._accountsRepository.findById(accountId);
		if (!account) {
			throw new Error(`Account with ID ${accountId.value} not found`);
		}

		// Get all transactions for this account
		const transactions = await this._transactionsRepository.findByAccountId(
			accountId
		);

		// Calculate expected balance based on transactions
		const expectedBalance = this._calculateExpectedBalance(
			account,
			transactions
		);

		// Get actual balance
		const actualBalance = account.balance.value;

		// Create and return the integrity result
		return AccountIntegrityResult.create(
			accountId,
			expectedBalance,
			actualBalance
		);
	}

	async calculateAllAccountsIntegrity(): Promise<IntegrityCheckReport> {
		this._logger.debug("Calculating integrity for all accounts");

		// Get all accounts
		const accounts = await this._accountsRepository.findAll();

		// Calculate integrity for each account
		const results: AccountIntegrityResult[] = [];
		for (const account of accounts) {
			try {
				const result = await this.calculateAccountIntegrity(account.id);
				results.push(result);
			} catch (error) {
				this._logger.error(
					"Failed to calculate integrity for account",
					error instanceof Error
						? error
						: new Error(
								`Failed to calculate integrity for account ${
									account.id.value
								}: ${String(error)}`
						  )
				);
				// Continue with other accounts even if one fails
			}
		}

		return IntegrityCheckReport.create(results);
	}

	async resolveDiscrepancy(accountId: AccountID): Promise<boolean> {
		this._logger.debug("Resolving discrepancy for account", {
			accountId: accountId.value,
		});

		try {
			// First calculate the integrity to get the expected balance
			const integrityResult = await this.calculateAccountIntegrity(
				accountId
			);

			if (integrityResult.hasIntegrity) {
				this._logger.debug("Account has no discrepancy to resolve", {
					accountId: accountId.value,
				});
				return true;
			}

			// Get the account and update its balance
			const account = await this._accountsRepository.findById(accountId);
			if (!account) {
				throw new Error(`Account with ID ${accountId.value} not found`);
			}

			// Update the account balance to match the expected balance
			const accountCopy = account.copy();
			accountCopy.updateBalance(
				new AccountBalance(integrityResult.expectedBalance)
			);

			// Persist the updated account
			await this._accountsRepository.persist(accountCopy);

			this._logger.debug("Successfully resolved account discrepancy", {
				accountId: accountId.value,
				previousBalance: integrityResult.actualBalance.value,
				newBalance: integrityResult.expectedBalance.value,
				adjustment: integrityResult.discrepancy.value,
			});

			return true;
		} catch (error) {
			this._logger.error(
				"Failed to resolve discrepancy for account",
				error instanceof Error
					? error
					: new Error(
							`Failed to resolve discrepancy for account ${
								accountId.value
							}: ${String(error)}`
					  )
			);
			return false;
		}
	}

	private _calculateExpectedBalance(
		account: Account,
		transactions: Transaction[]
	): PriceValueObject {
		// Start with initial balance of zero (assuming all transactions reflect the full balance history)
		let expectedBalance = new PriceValueObject(0, {
			decimals: 2,
			withSign: false,
		});

		this._logger.debug("Calculating expected balance", {
			accountId: account.id.value,
			transactionCount: transactions.length,
			initialBalance: expectedBalance.value,
		});

		// Apply all transactions to calculate the expected balance
		for (const transaction of transactions) {
			const transactionAmount = transaction.getRealAmountForAccount(
				account.id
			);

			// For liability accounts, we need to invert the sign (same logic as in Account.adjustFromTransaction)
			const adjustedAmount = account.type.isLiability()
				? transactionAmount.times(new NumberValueObject(-1))
				: transactionAmount;

			expectedBalance = expectedBalance.plus(adjustedAmount);

			this._logger.debug("Applied transaction to expected balance", {
				transactionId: transaction.id.value,
				transactionAmount: transactionAmount.value,
				adjustedAmount: adjustedAmount.value,
				runningBalance: expectedBalance.value,
			});
		}

		this._logger.debug("Final expected balance calculated", {
			accountId: account.id.value,
			expectedBalance: expectedBalance.value,
		});

		return expectedBalance;
	}
}
