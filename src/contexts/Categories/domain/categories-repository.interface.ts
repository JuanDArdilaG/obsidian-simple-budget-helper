import { IRepository } from "contexts/Shared/domain/persistence/repository.interface";
import { Category, CategoryID } from "contexts/Categories/domain";

export interface ICategoriesRepository
	extends IRepository<CategoryID, Category> {}
