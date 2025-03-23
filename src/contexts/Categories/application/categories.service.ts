import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import {
	Category,
	CategoryName,
	ICategoriesRepository,
	ICategoriesService,
} from "../domain";

export class CategoriesService implements ICategoriesService {
	constructor(private _categoriesRepository: ICategoriesRepository) {}

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
