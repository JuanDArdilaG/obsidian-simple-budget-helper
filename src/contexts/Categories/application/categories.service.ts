import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import {
	Category,
	CategoryID,
	CategoryName,
	CategoryPrimitives,
	ICategoriesRepository,
	ICategoriesService,
} from "../domain";
import { Service } from "contexts/Shared/application/service.abstract";

export class CategoriesService
	extends Service<CategoryID, Category, CategoryPrimitives>
	implements ICategoriesService
{
	constructor(private readonly _categoriesRepository: ICategoriesRepository) {
		super("Category", _categoriesRepository);
	}

	async create(category: Category): Promise<void> {
		const existingCategory = await this._categoriesRepository.findByName(
			category.name
		);
		if (existingCategory)
			throw new InvalidArgumentError(
				"Category",
				category.name.toString(),
				`category with name ${category.name} already exists`
			);
		await this._categoriesRepository.persist(category);
	}

	async getByNameWithCreation(name: CategoryName): Promise<Category> {
		const existingCategory = await this._categoriesRepository.findByName(
			name
		);
		if (existingCategory) return existingCategory;

		const category = Category.create(name);
		await this._categoriesRepository.persist(category);

		return category;
	}
}
