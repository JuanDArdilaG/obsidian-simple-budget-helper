import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { IBrandRepository } from "../domain/brand-repository.interface";
import { Brand } from "../domain/brand.entity";

export type GetAllBrandsUseCaseOutput = {
	brands: Brand[];
};

export class GetAllBrandsUseCase
	implements QueryUseCase<void, GetAllBrandsUseCaseOutput>
{
	readonly #logger = new Logger("GetAllBrandsUseCase");
	constructor(private readonly _brandRepository: IBrandRepository) {}

	async execute(): Promise<GetAllBrandsUseCaseOutput> {
		const brands = await this._brandRepository.findAll();
		this.#logger.debugB("get all brands", { brands }).log();

		return {
			brands: brands.sort((a, b) =>
				a.name.value.localeCompare(b.name.value)
			),
		};
	}
}
