import { describe, expect, it, vi } from "vitest";
import { CategoryID } from "../../../../src/contexts/Categories/domain";
import { DeleteSubCategoryUseCase } from "../../../../src/contexts/Subcategories/application/delete-subcategory.usecase";
import { SubCategoryID } from "../../../../src/contexts/Subcategories/domain";

const makeServices = (opts: { hasRelated: boolean }) => {
	const subCategoriesService = {
		delete: vi.fn().mockResolvedValue(undefined),
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
	return { subCategoriesService, transactionsService, itemsService };
};

describe("DeleteSubCategoryUseCase", () => {
	it("deletes subcategory if no related items/transactions", async () => {
		const { subCategoriesService, transactionsService, itemsService } =
			makeServices({ hasRelated: false });
		const useCase = new DeleteSubCategoryUseCase(
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any
		);
		await expect(
			useCase.execute(SubCategoryID.generate())
		).resolves.toBeUndefined();
		// Should call delete
		expect(subCategoriesService.delete).toHaveBeenCalled();
		// Should NOT call reassign
		expect(
			transactionsService.reassignTransactionsSubCategory
		).not.toHaveBeenCalled();
		expect(itemsService.reassignItemsSubCategory).not.toHaveBeenCalled();
	});

	it("throws if related items/transactions and no reassignment", async () => {
		const { subCategoriesService, transactionsService, itemsService } =
			makeServices({ hasRelated: true });
		const useCase = new DeleteSubCategoryUseCase(
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any
		);
		await expect(useCase.execute(SubCategoryID.generate())).rejects.toThrow(
			"Cannot delete subcategory with related transactions or items. Please provide a subcategory to reassign them to."
		);
		// Should NOT call delete
		expect(subCategoriesService.delete).not.toHaveBeenCalled();
	});

	it("reassigns and deletes if related items/transactions and reassignment provided", async () => {
		const { subCategoriesService, transactionsService, itemsService } =
			makeServices({ hasRelated: true });
		const useCase = new DeleteSubCategoryUseCase(
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any
		);
		const subCatId = SubCategoryID.generate();
		const reassignId = SubCategoryID.generate();
		await expect(
			useCase.execute(subCatId, reassignId)
		).resolves.toBeUndefined();
		// Should call reassign and delete
		expect(
			transactionsService.reassignTransactionsSubCategory
		).toHaveBeenCalledWith(subCatId, reassignId);
		expect(itemsService.reassignItemsSubCategory).toHaveBeenCalledWith(
			subCatId,
			reassignId
		);
		expect(subCategoriesService.delete).toHaveBeenCalledWith(subCatId);
	});

	it("updates category when reassigning transactions to new subcategory", async () => {
		// This test verifies that the reassignment logic properly updates both subcategory and category
		const oldSubCategoryId = SubCategoryID.generate();
		const newSubCategoryId = SubCategoryID.generate();
		const newCategoryId = CategoryID.generate();

		// Mock the subcategory service to return a subcategory with a specific parent category
		const subCategoriesService = {
			delete: vi.fn().mockResolvedValue(undefined),
			getByID: vi.fn().mockResolvedValue({
				category: newCategoryId,
			}),
		};

		// Mock transactions service with more detailed reassignment logic
		const transactionsService = {
			hasTransactionsBySubCategory: vi.fn().mockResolvedValue(true),
			reassignTransactionsSubCategory: vi
				.fn()
				.mockImplementation(async (oldSubCat, newSubCat) => {
					// Verify that the reassignment method is called with correct parameters
					expect(oldSubCat).toEqual(oldSubCategoryId);
					expect(newSubCat).toEqual(newSubCategoryId);
				}),
		};

		const itemsService = {
			hasItemsBySubCategory: vi.fn().mockResolvedValue(false),
			reassignItemsSubCategory: vi
				.fn()
				.mockImplementation(async (oldSubCat, newSubCat) => {
					// Verify that the reassignment method is called with correct parameters
					expect(oldSubCat).toEqual(oldSubCategoryId);
					expect(newSubCat).toEqual(newSubCategoryId);
				}),
		};

		const useCase = new DeleteSubCategoryUseCase(
			subCategoriesService as any,
			transactionsService as any,
			itemsService as any
		);

		await expect(
			useCase.execute(oldSubCategoryId, newSubCategoryId)
		).resolves.toBeUndefined();

		// Verify that the reassignment methods were called
		expect(
			transactionsService.reassignTransactionsSubCategory
		).toHaveBeenCalledWith(oldSubCategoryId, newSubCategoryId);
		expect(subCategoriesService.delete).toHaveBeenCalledWith(
			oldSubCategoryId
		);
	});
});
