import { describe, expect, it, vi } from "vitest";
import { DeleteCategoryUseCase } from "../../../../src/contexts/Categories/application/delete-category.usecase";
import {
	Category,
	CategoryID,
} from "../../../../src/contexts/Categories/domain";

const makeServices = (opts: {
	hasRelated: boolean;
	category?: Category;
	subcategoriesWithTransactions?: Array<{
		id: string;
		name: string;
		transactionCount: number;
	}>;
	subcategoriesWithItems?: Array<{
		id: string;
		name: string;
		itemCount: number;
	}>;
}) => {
	const categoriesService = {
		delete: vi.fn().mockResolvedValue(undefined),
		getByID: vi.fn().mockResolvedValue(opts.category),
	};
	const transactionsService = {
		hasTransactionsByCategory: vi.fn().mockResolvedValue(opts.hasRelated),
		reassignTransactionsCategory: vi.fn().mockResolvedValue(undefined),
		reassignTransactionsCategoryAndSubcategory: vi
			.fn()
			.mockResolvedValue(undefined),
		hasTransactionsBySubCategory: vi.fn().mockResolvedValue(false),
		getBySubCategory: vi.fn().mockResolvedValue([]),
	};
	const itemsService = {
		hasItemsByCategory: vi.fn().mockResolvedValue(opts.hasRelated),
		reassignItemsCategory: vi.fn().mockResolvedValue(undefined),
		reassignItemsCategoryAndSubcategory: vi
			.fn()
			.mockResolvedValue(undefined),
		hasItemsBySubCategory: vi.fn().mockResolvedValue(false),
		getBySubCategory: vi.fn().mockResolvedValue([]),
	};
	const subCategoriesService = {
		getAll: vi.fn().mockResolvedValue([]),
		getByID: vi.fn().mockResolvedValue(null),
	};
	return {
		categoriesService,
		transactionsService,
		itemsService,
		subCategoriesService,
	};
};

describe("DeleteCategoryUseCase", () => {
	it("deletes category if no related items/transactions", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: false });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);
		await expect(
			useCase.execute(CategoryID.generate()),
		).resolves.toBeUndefined();
		// Should call delete
		expect(categoriesService.delete).toHaveBeenCalled();
		// Should NOT call reassign
		expect(
			transactionsService.reassignTransactionsCategory,
		).not.toHaveBeenCalled();
		expect(itemsService.reassignItemsCategory).not.toHaveBeenCalled();
	});

	it("throws if related items/transactions and no reassignment", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);
		await expect(useCase.execute(CategoryID.generate())).rejects.toThrow(
			"Cannot delete category with related data. Please provide a category and subcategory to reassign them to.",
		);
		// Should NOT call delete
		expect(categoriesService.delete).not.toHaveBeenCalled();
	});

	it("reassigns and deletes if related items/transactions and reassignment provided", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);
		const catId = CategoryID.generate();
		const reassignId = CategoryID.generate();
		await expect(
			useCase.execute(catId, reassignId),
		).resolves.toBeUndefined();
		// Should call reassign and delete
		expect(
			transactionsService.reassignTransactionsCategory,
		).toHaveBeenCalled();
		expect(itemsService.reassignItemsCategory).toHaveBeenCalled();
		expect(categoriesService.delete).toHaveBeenCalled();
	});

	it("reassigns to both category and subcategory when both are provided", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: true });

		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);
		const catId = CategoryID.generate();
		const reassignCategoryId = CategoryID.generate();
		const reassignSubcategoryId = { value: "sub1" } as any; // Mock SubCategoryID

		await expect(
			useCase.execute(catId, reassignCategoryId, reassignSubcategoryId),
		).resolves.toBeUndefined();

		// Should call the new reassignment methods
		expect(
			transactionsService.reassignTransactionsCategoryAndSubcategory,
		).toHaveBeenCalledWith(
			catId,
			reassignCategoryId,
			reassignSubcategoryId,
		);
		expect(
			itemsService.reassignItemsCategoryAndSubcategory,
		).toHaveBeenCalled();
		expect(categoriesService.delete).toHaveBeenCalledWith(catId);
	});

	it("throws detailed error when subcategories have related transactions", async () => {
		const subcategoriesWithTransactions = [
			{ id: "sub1", name: "Subcategory 1", transactionCount: 5 },
			{ id: "sub2", name: "Subcategory 2", transactionCount: 3 },
		];

		const mockSubcategories = [
			{
				id: { value: "sub1" },
				name: { toString: () => "Subcategory 1" },
				category: { equalTo: vi.fn().mockReturnValue(true) },
			},
			{
				id: { value: "sub2" },
				name: { toString: () => "Subcategory 2" },
				category: { equalTo: vi.fn().mockReturnValue(true) },
			},
		];

		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({
			hasRelated: false,
			subcategoriesWithTransactions,
		});

		// Mock subcategories service to return subcategories
		subCategoriesService.getAll.mockResolvedValue(mockSubcategories);

		// Mock transactions service to return transactions for subcategories
		transactionsService.hasTransactionsBySubCategory
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(true);
		transactionsService.getBySubCategory
			.mockResolvedValueOnce(Array(5).fill({}))
			.mockResolvedValueOnce(Array(3).fill({}));

		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);

		await expect(useCase.execute(CategoryID.generate())).rejects.toThrow(
			/Cannot delete category with related data/,
		);

		// Test the specific error message
		try {
			await useCase.execute(CategoryID.generate());
		} catch (error) {
			expect(error.message).toContain(
				'Subcategories with transactions: "Subcategory 1" (5 transactions), "Subcategory 2" (3 transactions)',
			);
		}
	});

	it("throws detailed error when subcategories have related items", async () => {
		const subcategoriesWithItems = [
			{ id: "sub1", name: "Subcategory 1", itemCount: 2 },
			{ id: "sub2", name: "Subcategory 2", itemCount: 1 },
		];

		const mockSubcategories = [
			{
				id: { value: "sub1" },
				name: { toString: () => "Subcategory 1" },
				category: { equalTo: vi.fn().mockReturnValue(true) },
			},
			{
				id: { value: "sub2" },
				name: { toString: () => "Subcategory 2" },
				category: { equalTo: vi.fn().mockReturnValue(true) },
			},
		];

		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({
			hasRelated: false,
			subcategoriesWithItems,
		});

		// Mock subcategories service to return subcategories
		subCategoriesService.getAll.mockResolvedValue(mockSubcategories);

		// Mock items service to return items for subcategories
		itemsService.hasItemsBySubCategory
			.mockResolvedValueOnce(true)
			.mockResolvedValueOnce(true);
		itemsService.getBySubCategory
			.mockResolvedValueOnce(Array(2).fill({}))
			.mockResolvedValueOnce(Array(1).fill({}));

		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);

		const error = await useCase
			.execute(CategoryID.generate())
			.catch((e) => e);
		expect(error.message).toContain(
			'Subcategories with scheduled items: "Subcategory 1" (2 items), "Subcategory 2" (1 items)',
		);
	});

	it("returns null when checkCategoryDeletion finds no issues", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: false });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);

		const result = await useCase.checkCategoryDeletion(
			CategoryID.generate(),
		);
		expect(result).toBeNull();
	});

	it("returns error details when checkCategoryDeletion finds issues", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subCategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subCategoriesService as any,
		);

		const result = await useCase.checkCategoryDeletion(
			CategoryID.generate(),
		);
		expect(result).toEqual({
			hasRelatedTransactions: true,
			hasRelatedItems: true,
			subcategoriesWithTransactions: [],
			subcategoriesWithItems: [],
		});
	});
});
