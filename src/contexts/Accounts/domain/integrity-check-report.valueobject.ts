import { AccountIntegrityResult } from "./account-integrity-result.valueobject";

export class IntegrityCheckReport {
	constructor(
		private readonly _results: AccountIntegrityResult[],
		private readonly _executionDate: Date
	) {}

	static create(results: AccountIntegrityResult[]): IntegrityCheckReport {
		return new IntegrityCheckReport(results, new Date());
	}

	get results(): AccountIntegrityResult[] {
		return this._results;
	}

	get executionDate(): Date {
		return this._executionDate;
	}

	get hasDiscrepancies(): boolean {
		return this._results.some((result) => result.hasDiscrepancy);
	}

	get accountsWithDiscrepancies(): AccountIntegrityResult[] {
		return this._results.filter((result) => result.hasDiscrepancy);
	}

	get accountsWithIntegrity(): AccountIntegrityResult[] {
		return this._results.filter((result) => result.hasIntegrity);
	}

	get totalAccountsChecked(): number {
		return this._results.length;
	}

	get totalDiscrepancies(): number {
		return this.accountsWithDiscrepancies.length;
	}

	toPrimitives(): IntegrityCheckReportPrimitives {
		return {
			results: this._results.map((result) => result.toPrimitives()),
			executionDate: this._executionDate.toISOString(),
			hasDiscrepancies: this.hasDiscrepancies,
			totalAccountsChecked: this.totalAccountsChecked,
			totalDiscrepancies: this.totalDiscrepancies,
		};
	}
}

export interface IntegrityCheckReportPrimitives {
	results: Array<{
		accountId: string;
		expectedBalance: number;
		actualBalance: number;
		hasIntegrity: boolean;
		discrepancy: number;
	}>;
	executionDate: string;
	hasDiscrepancies: boolean;
	totalAccountsChecked: number;
	totalDiscrepancies: number;
}
