import { PriceValueObject } from "@juandardilag/value-objects";
import {
	AccountIntegrityResult,
	IntegrityCheckReport,
} from "contexts/Accounts/domain";
import { Nanoid } from "contexts/Shared/domain";

describe("IntegrityCheckReport", () => {
	const createMockIntegrityResult = (
		accountId: string,
		discrepancy: number = 0,
	) => {
		const accountIdObj = new Nanoid(accountId);
		const expectedBalance = new PriceValueObject(100);
		const actualBalance = new PriceValueObject(100 + discrepancy);
		return AccountIntegrityResult.create(
			accountIdObj,
			expectedBalance,
			actualBalance,
		);
	};

	describe("create", () => {
		it("should create a report with execution date", () => {
			// Arrange
			const results = [
				createMockIntegrityResult(Nanoid.generate().value),
				createMockIntegrityResult(Nanoid.generate().value, 50),
			];

			// Act
			const report = IntegrityCheckReport.create(results);

			// Assert
			expect(report.results).toBe(results);
			expect(report.executionDate).toBeInstanceOf(Date);
			expect(report.executionDate.getTime()).toBeLessThanOrEqual(
				Date.now(),
			);
			expect(report.executionDate.getTime()).toBeGreaterThan(
				Date.now() - 1000,
			); // Within last second
		});
	});

	describe("hasDiscrepancies", () => {
		it("should return true when there are accounts with discrepancies", () => {
			// Arrange
			const results = [
				createMockIntegrityResult(Nanoid.generate().value),
				createMockIntegrityResult(Nanoid.generate().value, 50),
			];
			const report = IntegrityCheckReport.create(results);

			// Act & Assert
			expect(report.hasDiscrepancies).toBe(true);
		});

		it("should return false when all accounts have integrity", () => {
			// Arrange
			const results = [
				createMockIntegrityResult(Nanoid.generate().value),
				createMockIntegrityResult(Nanoid.generate().value),
			];
			const report = IntegrityCheckReport.create(results);

			// Act & Assert
			expect(report.hasDiscrepancies).toBe(false);
		});

		it("should return false for empty results", () => {
			// Arrange
			const results: AccountIntegrityResult[] = [];
			const report = IntegrityCheckReport.create(results);

			// Act & Assert
			expect(report.hasDiscrepancies).toBe(false);
		});
	});

	describe("accountsWithDiscrepancies", () => {
		it("should return only accounts with discrepancies", () => {
			// Arrange
			const integrityResult = createMockIntegrityResult(
				Nanoid.generate().value,
			);
			const discrepancyResult = createMockIntegrityResult(
				Nanoid.generate().value,
				50,
			);
			const results = [integrityResult, discrepancyResult];
			const report = IntegrityCheckReport.create(results);

			// Act
			const accountsWithDiscrepancies = report.accountsWithDiscrepancies;

			// Assert
			expect(accountsWithDiscrepancies).toHaveLength(1);
			expect(accountsWithDiscrepancies[0]).toBe(discrepancyResult);
		});
	});

	describe("accountsWithIntegrity", () => {
		it("should return only accounts with integrity", () => {
			// Arrange
			const integrityResult = createMockIntegrityResult(
				Nanoid.generate().value,
			);
			const discrepancyResult = createMockIntegrityResult(
				Nanoid.generate().value,
				50,
			);
			const results = [integrityResult, discrepancyResult];
			const report = IntegrityCheckReport.create(results);

			// Act
			const accountsWithIntegrity = report.accountsWithIntegrity;

			// Assert
			expect(accountsWithIntegrity).toHaveLength(1);
			expect(accountsWithIntegrity[0]).toBe(integrityResult);
		});
	});

	describe("statistics", () => {
		it("should calculate correct statistics", () => {
			// Arrange
			const results = [
				createMockIntegrityResult(Nanoid.generate().value),
				createMockIntegrityResult(Nanoid.generate().value, 50),
				createMockIntegrityResult(Nanoid.generate().value, -25),
				createMockIntegrityResult(Nanoid.generate().value),
			];
			const report = IntegrityCheckReport.create(results);

			// Act & Assert
			expect(report.totalAccountsChecked).toBe(4);
			expect(report.totalDiscrepancies).toBe(2);
		});
	});

	describe("toPrimitives", () => {
		it("should convert to primitives correctly", () => {
			// Arrange
			const accountId1 = Nanoid.generate().value;
			const accountId2 = Nanoid.generate().value;
			const results = [
				createMockIntegrityResult(accountId1),
				createMockIntegrityResult(accountId2, 50),
			];
			const report = IntegrityCheckReport.create(results);

			// Act
			const primitives = report.toPrimitives();

			// Assert
			expect(primitives.results).toHaveLength(2);
			expect(primitives.results[0].accountId).toBe(accountId1);
			expect(primitives.results[1].accountId).toBe(accountId2);
			expect(primitives.hasDiscrepancies).toBe(true);
			expect(primitives.totalAccountsChecked).toBe(2);
			expect(primitives.totalDiscrepancies).toBe(1);
			expect(primitives.executionDate).toBe(
				report.executionDate.toISOString(),
			);
		});
	});
});
