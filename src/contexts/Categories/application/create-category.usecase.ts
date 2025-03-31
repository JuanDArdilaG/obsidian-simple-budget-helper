import { CommandUseCase } from "contexts/Shared/domain";
import { Category, ICategoriesService } from "contexts/Categories/domain";

export type CreateCategoryUseCaseInput = Category;

export class CreateCategoryUseCase
	implements CommandUseCase<CreateCategoryUseCaseInput>
{
	constructor(private _categoriesService: ICategoriesService) {}

	async execute(category: Category): Promise<void> {
		await this._categoriesService.create(category);
	}
}
