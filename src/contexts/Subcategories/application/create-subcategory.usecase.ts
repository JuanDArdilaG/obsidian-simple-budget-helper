import { CommandUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	SubCategory,
} from "contexts/Subcategories/domain";

export type CreateSubCategoryUseCaseInput = SubCategory;

export class CreateSubCategoryUseCase
	implements CommandUseCase<CreateSubCategoryUseCaseInput>
{
	constructor(private readonly subCategoriesService: ISubCategoriesService) {}

	async execute(subCategory: SubCategory): Promise<void> {
		await this.subCategoriesService.create(subCategory);
	}
}
