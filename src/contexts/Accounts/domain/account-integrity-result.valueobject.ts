import { PriceValueObject } from "@juandardilag/value-objects";
import { Logger } from "../../Shared/infrastructure/logger";
import { TransactionAmount } from "../../Transactions/domain";
import { AccountID } from "./account-id.valueobject";

export class AccountIntegrityResult {
	static readonly #logger = new Logger("AccountIntegrityResult");
	constructor(
		private readonly _accountId: AccountID,
		private readonly _expectedBalance: PriceValueObject,
		private readonly _actualBalance: PriceValueObject,
		private readonly _hasIntegrity: boolean,
		private readonly _discrepancy: PriceValueObject,
	) {}

	static create(
		accountId: AccountID,
		expectedBalance: PriceValueObject,
		actualBalance: PriceValueObject,
	): AccountIntegrityResult {
		const discrepancy = actualBalance.subtract(expectedBalance);
		const hasIntegrity = discrepancy.lessOrEqualThan(
			new TransactionAmount(0.001),
		);

		this.#logger.debug("Account integrity calculated", {
			accountId: accountId.value,
			expectedBalance: expectedBalance.value,
			actualBalance: actualBalance.value,
			hasIntegrity: hasIntegrity,
			discrepancy: discrepancy.value,
		});

		return new AccountIntegrityResult(
			accountId,
			expectedBalance,
			actualBalance,
			hasIntegrity,
			discrepancy,
		);
	}

	get accountId(): AccountID {
		return this._accountId;
	}

	get expectedBalance(): PriceValueObject {
		return this._expectedBalance;
	}

	get actualBalance(): PriceValueObject {
		return this._actualBalance;
	}

	get hasIntegrity(): boolean {
		return this._hasIntegrity;
	}

	get discrepancy(): PriceValueObject {
		return this._discrepancy;
	}

	get hasDiscrepancy(): boolean {
		return !this._hasIntegrity;
	}

	toPrimitives(): AccountIntegrityResultPrimitives {
		return {
			accountId: this._accountId.value,
			expectedBalance: this._expectedBalance.value,
			actualBalance: this._actualBalance.value,
			hasIntegrity: this._hasIntegrity,
			discrepancy: this._discrepancy.value,
		};
	}
}

export interface AccountIntegrityResultPrimitives {
	accountId: string;
	expectedBalance: number;
	actualBalance: number;
	hasIntegrity: boolean;
	discrepancy: number;
}
