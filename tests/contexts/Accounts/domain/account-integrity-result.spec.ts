import { PriceValueObject } from "@juandardilag/value-objects";
import { AccountIntegrityResult } from "contexts/Accounts/domain";
import { describe, expect, it } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";

describe("AccountIntegrityResult", () => {
	describe("create", () => {
		it("should create an integrity result with no discrepancy when balances match", () => {
			// Arrange
			const accountId = Nanoid.generate();
			const expectedBalance = new PriceValueObject(100);
			const actualBalance = new PriceValueObject(100);

			// Act
			const result = AccountIntegrityResult.create(
				accountId,
				expectedBalance,
				actualBalance,
			);

			// Assert
			expect(result.accountId).toBe(accountId);
			expect(result.expectedBalance).toBe(expectedBalance);
			expect(result.actualBalance).toBe(actualBalance);
			expect(result.hasIntegrity).toBe(true);
			expect(result.hasDiscrepancy).toBe(false);
			expect(result.discrepancy.equalTo(new PriceValueObject(0))).toBe(
				true,
			);
		});

		it("should create an integrity result with discrepancy when balances don't match", () => {
			// Arrange
			const accountId = Nanoid.generate();
			const expectedBalance = new PriceValueObject(100);
			const actualBalance = new PriceValueObject(150);

			// Act
			const result = AccountIntegrityResult.create(
				accountId,
				expectedBalance,
				actualBalance,
			);

			// Assert
			expect(result.accountId).toBe(accountId);
			expect(result.expectedBalance).toBe(expectedBalance);
			expect(result.actualBalance).toBe(actualBalance);
			expect(result.hasIntegrity).toBe(false);
			expect(result.hasDiscrepancy).toBe(true);
			expect(result.discrepancy.equalTo(new PriceValueObject(50))).toBe(
				true,
			); // 150 - 100 = 50
		});

		it("should create an integrity result with negative discrepancy", () => {
			// Arrange
			const accountId = Nanoid.generate();
			const expectedBalance = new PriceValueObject(200);
			const actualBalance = new PriceValueObject(150);

			// Act
			const result = AccountIntegrityResult.create(
				accountId,
				expectedBalance,
				actualBalance,
			);

			// Assert
			expect(result.hasIntegrity).toBe(false);
			expect(result.hasDiscrepancy).toBe(true);
			expect(result.discrepancy.equalTo(new PriceValueObject(-50))).toBe(
				true,
			); // 150 - 200 = -50
		});
	});

	describe("toPrimitives", () => {
		it("should convert to primitives correctly", () => {
			// Arrange
			const accountId = Nanoid.generate();
			const expectedBalance = new PriceValueObject(100);
			const actualBalance = new PriceValueObject(150);
			const result = AccountIntegrityResult.create(
				accountId,
				expectedBalance,
				actualBalance,
			);

			// Act
			const primitives = result.toPrimitives();

			// Assert
			expect(primitives).toEqual({
				accountId: accountId.value,
				expectedBalance: 100,
				actualBalance: 150,
				hasIntegrity: false,
				discrepancy: 50,
			});
		});
	});
});
