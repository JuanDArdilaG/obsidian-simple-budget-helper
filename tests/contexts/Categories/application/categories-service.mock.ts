import {
	Category,
	CategoryID,
	CategoryName,
	CategoryPrimitives,
	ICategoriesService,
} from "contexts/Categories/domain";
import { Criteria } from "contexts/Shared/domain";

export class CategoriesServiceMock implements ICategoriesService {
	constructor(public categories: Category[]) {}
	create(category: Category): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getByNameWithCreation(name: CategoryName): Promise<Category> {
		throw new Error("Method not implemented.");
	}
	exists(id: CategoryID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	getByID(id: CategoryID): Promise<Category> {
		const category = this.categories.find(
			(category) => category.id.value === id.value
		);
		if (!category) throw new Error("category not found on get");
		return Promise.resolve(category);
	}
	getByCriteria(criteria: Criteria<CategoryPrimitives>): Promise<Category[]> {
		throw new Error("Method not implemented.");
	}
	getAll(): Promise<Category[]> {
		throw new Error("Method not implemented.");
	}
	update(item: Category): Promise<void> {
		throw new Error("Method not implemented.");
	}
	delete(id: CategoryID): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
