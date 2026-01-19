import { Nanoid } from "../../Shared/domain";
import { AccountIntegrityResult } from "./account-integrity-result.valueobject";
import { IntegrityCheckReport } from "./integrity-check-report.valueobject";

export interface IAccountsIntegrityService {
	/**
	 * Calculate integrity for a specific account
	 * @param accountId The account to check
	 * @returns The integrity result for the account
	 */
	calculateAccountIntegrity(
		accountId: Nanoid,
	): Promise<AccountIntegrityResult>;

	/**
	 * Calculate integrity for all accounts
	 * @returns A complete integrity check report
	 */
	calculateAllAccountsIntegrity(): Promise<IntegrityCheckReport>;

	/**
	 * Resolve discrepancy by adjusting the account balance to match expected balance
	 * @param accountId The account with discrepancy
	 * @returns True if resolution was successful
	 */
	resolveDiscrepancy(accountId: Nanoid): Promise<boolean>;
}
