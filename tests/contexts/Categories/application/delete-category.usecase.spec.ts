import { describe, expect, it, vi } from "vitest";
import { DeleteCategoryUseCase } from "../../../../src/contexts/Categories/application/delete-category.usecase";
import { CategoryID } from "../../../../src/contexts/Categories/domain";

const makeServices = (opts: {
	hasRelated: boolean;
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
	const categoriesService = { delete: vi.fn().mockResolvedValue(undefined) };
	const transactionsService = {
		hasTransactionsByCategory: vi.fn().mockResolvedValue(opts.hasRelated),
		reassignTransactionsCategory: vi.fn().mockResolvedValue(undefined),
		hasTransactionsBySubCategory: vi.fn().mockResolvedValue(false),
		getBySubCategory: vi.fn().mockResolvedValue([]),
	};
	const itemsService = {
		hasItemsByCategory: vi.fn().mockResolvedValue(opts.hasRelated),
		reassignItemsCategory: vi.fn().mockResolvedValue(undefined),
		hasItemsBySubCategory: vi.fn().mockResolvedValue(false),
		getBySubCategory: vi.fn().mockResolvedValue([]),
	};
	const subcategoriesService = {
		getAll: vi.fn().mockResolvedValue([]),
	};
	return {
		categoriesService,
		transactionsService,
		itemsService,
		subcategoriesService,
	};
};

describe("DeleteCategoryUseCase", () => {
	it("deletes category if no related items/transactions", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subcategoriesService,
		} = makeServices({ hasRelated: false });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subcategoriesService as any
		);
		await expect(
			useCase.execute(CategoryID.generate())
		).resolves.toBeUndefined();
		// Should call delete
		expect(categoriesService.delete).toHaveBeenCalled();
		// Should NOT call reassign
		expect(
			transactionsService.reassignTransactionsCategory
		).not.toHaveBeenCalled();
		expect(itemsService.reassignItemsCategory).not.toHaveBeenCalled();
	});

	it("throws if related items/transactions and no reassignment", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subcategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subcategoriesService as any
		);
		await expect(useCase.execute(CategoryID.generate())).rejects.toThrow(
			"Cannot delete category with related data. Please provide a category to reassign them to."
		);
		// Should NOT call delete
		expect(categoriesService.delete).not.toHaveBeenCalled();
	});

	it("reassigns and deletes if related items/transactions and reassignment provided", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subcategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subcategoriesService as any
		);
		const catId = CategoryID.generate();
		const reassignId = CategoryID.generate();
		await expect(
			useCase.execute(catId, reassignId)
		).resolves.toBeUndefined();
		// Should call reassign and delete
		expect(
			transactionsService.reassignTransactionsCategory
		).toHaveBeenCalledWith(catId, reassignId);
		expect(itemsService.reassignItemsCategory).toHaveBeenCalledWith(
			catId,
			reassignId
		);
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
			subcategoriesService,
		} = makeServices({
			hasRelated: false,
			subcategoriesWithTransactions,
		});

		// Mock subcategories service to return subcategories
		subcategoriesService.getAll.mockResolvedValue(mockSubcategories);

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
			subcategoriesService as any
		);

		await expect(useCase.execute(CategoryID.generate())).rejects.toThrow(
			/Cannot delete category with related data/
		);

		// Test the specific error message
		try {
			await useCase.execute(CategoryID.generate());
		} catch (error) {
			expect(error.message).toContain(
				'Subcategories with transactions: "Subcategory 1" (5 transactions), "Subcategory 2" (3 transactions)'
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
			subcategoriesService,
		} = makeServices({
			hasRelated: false,
			subcategoriesWithItems,
		});

		// Mock subcategories service to return subcategories
		subcategoriesService.getAll.mockResolvedValue(mockSubcategories);

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
			subcategoriesService as any
		);

		const error = await useCase
			.execute(CategoryID.generate())
			.catch((e) => e);
		expect(error.message).toContain(
			'Subcategories with scheduled items: "Subcategory 1" (2 items), "Subcategory 2" (1 items)'
		);
	});

	it("returns null when checkCategoryDeletion finds no issues", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subcategoriesService,
		} = makeServices({ hasRelated: false });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subcategoriesService as any
		);

		const result = await useCase.checkCategoryDeletion(
			CategoryID.generate()
		);
		expect(result).toBeNull();
	});

	it("returns error details when checkCategoryDeletion finds issues", async () => {
		const {
			categoriesService,
			transactionsService,
			itemsService,
			subcategoriesService,
		} = makeServices({ hasRelated: true });
		const useCase = new DeleteCategoryUseCase(
			categoriesService as any,
			transactionsService as any,
			itemsService as any,
			subcategoriesService as any
		);

		const result = await useCase.checkCategoryDeletion(
			CategoryID.generate()
		);
		expect(result).toEqual({
			hasRelatedTransactions: true,
			hasRelatedItems: true,
			subcategoriesWithTransactions: [],
			subcategoriesWithItems: [],
		});
	});
});
