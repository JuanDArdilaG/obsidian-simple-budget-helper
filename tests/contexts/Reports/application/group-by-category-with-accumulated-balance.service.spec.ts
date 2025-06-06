import { describe, expect, it } from "vitest";
import { buildTestTransactions } from "../domain/buildTestTransactions";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { TransactionsReport } from "contexts/Reports/domain";
import { CategoriesServiceMock } from "../../Categories/application/categories-service.mock";
import { SubcategoriesServiceMock } from "../../Subcategories/application/subcategories-service.mock";
import { Category, CategoryName } from "contexts/Categories/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";

describe("execute", () => {
	it("should group by category with accumulated balance for two transactions", async () => {
		const categoriesService = new CategoriesServiceMock([
			Category.create(new CategoryName("test")),
		]);
		const subcategoriesService = new SubcategoriesServiceMock([
			SubCategory.create(
				categoriesService.categories[0].id,
				new SubCategoryName("test")
			),
			SubCategory.create(
				categoriesService.categories[0].id,
				new SubCategoryName("test2")
			),
		]);
		const useCase = new GroupByCategoryWithAccumulatedBalanceUseCase(
			categoriesService,
			subcategoriesService
		);
		const transactions = buildTestTransactions([
			{
				amount: 100,
				category: categoriesService.categories[0].id.value,
				subcategory: subcategoriesService.subcategories[0].id.value,
				operation: "expense",
			},
			{
				amount: 200,
				category: categoriesService.categories[0].id.value,
				subcategory: subcategoriesService.subcategories[1].id.value,
				operation: "income",
			},
		]);
		const report = new TransactionsReport(transactions);

		const result = await useCase.execute(report);

		expect(
			result[categoriesService.categories[0].id.value].balance.value
		).toBe(100);
		expect(
			result[categoriesService.categories[0].id.value].subCategories[
				subcategoriesService.subcategories[0].id.value
			].balance.value
		).toBe(-100);
		expect(
			result[categoriesService.categories[0].id.value].subCategories[
				subcategoriesService.subcategories[1].id.value
			].balance.value
		).toBe(200);
	});
});
