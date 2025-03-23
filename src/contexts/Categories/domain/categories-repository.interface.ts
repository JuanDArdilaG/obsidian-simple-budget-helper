import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import {
	Category,
	CategoryID,
	CategoryName,
	CategoryPrimitives,
} from "contexts/Categories/domain";

export interface ICategoriesRepository
	extends IRepository<CategoryID, Category, CategoryPrimitives> {
	findByName(name: CategoryName): Promise<Category | null>;
}
