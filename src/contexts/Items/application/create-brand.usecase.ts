import { Logger } from "../../Shared/infrastructure/logger";
import { IBrandRepository } from "../domain/brand-repository.interface";
import { Brand } from "../domain/brand.entity";

const logger = new Logger("CreateBrandUseCase");

export type CreateBrandUseCaseInput = Brand;

export class CreateBrandUseCase {
	constructor(private readonly _brandRepository: IBrandRepository) {}

	async execute(brand: CreateBrandUseCaseInput): Promise<void> {
		logger.debug("brand to persist", {
			brand: brand.toPrimitives(),
		});

		await this._brandRepository.persist(brand);
	}
}
