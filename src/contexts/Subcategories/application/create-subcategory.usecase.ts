import { CommandUseCase } from "contexts/Shared/domain";
import {
	ISubCategoriesService,
	SubCategory,
} from "contexts/Subcategories/domain";

export type CreateSubCategoryUseCaseInput = SubCategory;

export class CreateSubCategoryUseCase
	implements CommandUseCase<CreateSubCategoryUseCaseInput>
{
	constructor(
		private readonly _subcategoriesService: ISubCategoriesService
	) {}

	async execute(subCategory: SubCategory): Promise<void> {
		await this._subcategoriesService.create(subCategory);
	}
}
