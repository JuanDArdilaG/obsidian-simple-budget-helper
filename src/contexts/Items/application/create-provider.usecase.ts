import { Logger } from "../../Shared/infrastructure/logger";
import { IProviderRepository } from "../domain/provider-repository.interface";
import { Provider } from "../domain/provider.entity";

const logger = new Logger("CreateProviderUseCase");

export type CreateProviderUseCaseInput = Provider;

export class CreateProviderUseCase {
	constructor(private readonly _providerRepository: IProviderRepository) {}

	async execute(provider: CreateProviderUseCaseInput): Promise<void> {
		logger.debug("provider to persist", {
			provider: provider.toPrimitives(),
		});

		await this._providerRepository.persist(provider);
	}
}
