import { PriceValueObject } from "@juandardilag/value-objects";
import { Nanoid } from "contexts/Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { TransactionAmount } from "../../Transactions/domain";

export class AccountIntegrityResult {
	static readonly #logger = new Logger("AccountIntegrityResult");
	constructor(
		private readonly _accountId: Nanoid,
		private readonly _expectedBalance: PriceValueObject,
		private readonly _actualBalance: PriceValueObject,
		private readonly _hasIntegrity: boolean,
		private readonly _discrepancy: PriceValueObject,
	) {}

	static create(
		accountId: Nanoid,
		expectedBalance: PriceValueObject,
		actualBalance: PriceValueObject,
	): AccountIntegrityResult {
		const discrepancy = actualBalance.subtract(expectedBalance);
		const hasIntegrity = discrepancy
			.abs()
			.lessOrEqualThan(new TransactionAmount(0.001));

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

	get accountId(): Nanoid {
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
