import { describe, expect, it, vi } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { DeleteSubCategoryUseCase } from "../../../../src/contexts/Subcategories/application/delete-subcategory.usecase";

const makeServices = (opts: { hasRelated: boolean }) => {
	const categoriesService = {
		delete: vi.fn().mockResolvedValue(undefined),
		getByID: vi.fn().mockResolvedValue({}),
	};
	const subCategoriesService = {
		delete: vi.fn().mockResolvedValue(undefined),
		getByID: vi.fn().mockResolvedValue({}),
	};
	const transactionsService = {
		hasTransactionsBySubCategory: vi
			.fn()
			.mockResolvedValue(opts.hasRelated),
		reassignTransactionsSubCategory: vi.fn().mockResolvedValue(undefined),
	};
	const itemsService = {
		hasItemsBySubCategory: vi.fn().mockResolvedValue(opts.hasRelated),
		reassignItemsSubCategory: vi.fn().mockResolvedValue(undefined),
	};
	return {
		categoriesService,
		subCategoriesService,
		transactionsService,
		itemsService,
	};
};

describe("DeleteSubCategoryUseCase", () => {
	it("deletes subcategory if no related items/transactions", async () => {
		const {
			categoriesService,
			subCategoriesService,
			transactionsService,
			itemsService,
		} = makeServices({ hasRelated: false });
		const useCase = new DeleteSubCategoryUseCase(
			categoriesService as any,
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any,
		);
		await expect(
			useCase.execute(Nanoid.generate(), Nanoid.generate()),
		).resolves.toBeUndefined();
		// Should call delete
		expect(subCategoriesService.delete).toHaveBeenCalled();
		// Should NOT call reassign
		expect(
			transactionsService.reassignTransactionsSubCategory,
		).not.toHaveBeenCalled();
		expect(itemsService.reassignItemsSubCategory).not.toHaveBeenCalled();
	});

	it("throws if related items/transactions and no reassignment", async () => {
		const {
			categoriesService,
			subCategoriesService,
			transactionsService,
			itemsService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteSubCategoryUseCase(
			categoriesService as any,
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any,
		);
		await expect(
			useCase.execute(Nanoid.generate(), Nanoid.generate()),
		).rejects.toThrow(
			"Cannot delete subcategory with related transactions or items. Please provide a subcategory to reassign them to.",
		);
		// Should NOT call delete
		expect(subCategoriesService.delete).not.toHaveBeenCalled();
	});

	it("updates category when reassigning transactions to new subcategory", async () => {
		// This test verifies that the reassignment logic properly updates both subcategory and category
		const oldCategoryId = Nanoid.generate();
		const oldSubCategoryId = Nanoid.generate();
		const newSubCategoryId = Nanoid.generate();
		const newCategoryId = Nanoid.generate();

		const categoriesService = {
			delete: vi.fn().mockResolvedValue(undefined),
			getByID: vi.fn().mockResolvedValue({}),
		};

		// Mock the subcategory service to return a subcategory with a specific parent category
		const subCategoriesService = {
			delete: vi.fn().mockResolvedValue(undefined),
			getByID: vi.fn().mockResolvedValue({
				category: newCategoryId,
			}),
		};

		// Mock transactions service with more detailed reassignment logic
		const transactionsService = {
			hasTransactionsBySubCategory: vi.fn().mockResolvedValue(false),
			reassignTransactionsCategoryAndSubcategory: vi
				.fn()
				.mockResolvedValue(undefined),
		};

		const itemsService = {
			hasItemsBySubCategory: vi.fn().mockResolvedValue(false),
			reassignItemsCategoryAndSubcategory: vi.fn(),
		};

		const useCase = new DeleteSubCategoryUseCase(
			categoriesService as any,
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any,
		);

		await expect(
			useCase.execute(
				oldCategoryId,
				oldSubCategoryId,
				newCategoryId,
				newSubCategoryId,
			),
		).resolves.toBeUndefined();

		// Verify that the reassignment methods were called
		expect(
			transactionsService.reassignTransactionsCategoryAndSubcategory,
		).toHaveBeenCalled();
		expect(subCategoriesService.delete).toHaveBeenCalledWith(
			oldSubCategoryId.value,
		);
	});
});
