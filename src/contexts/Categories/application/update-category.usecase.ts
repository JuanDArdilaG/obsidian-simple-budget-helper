import { Category, ICategoriesService } from "contexts/Categories/domain";
import { CommandUseCase } from "contexts/Shared/domain";

export class UpdateCategoryUseCase implements CommandUseCase<Category> {
	constructor(private readonly categoriesService: ICategoriesService) {}

	async execute(category: Category): Promise<void> {
		await this.categoriesService.update(category);
	}
}
