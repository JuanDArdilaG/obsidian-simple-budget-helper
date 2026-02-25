import { Category, ICategoriesService } from "contexts/Categories/domain";
import { CommandUseCase } from "contexts/Shared/domain";

export type CreateCategoryUseCaseInput = Category;

export class CreateCategoryUseCase implements CommandUseCase<CreateCategoryUseCaseInput> {
	constructor(private readonly categoriesService: ICategoriesService) {}

	async execute(category: Category): Promise<void> {
		await this.categoriesService.create(category);
	}
}
