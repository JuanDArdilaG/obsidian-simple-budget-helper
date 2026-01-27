import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { IRecurrenceModificationsService } from "../domain";

export type DeleteItemRecurrenceUseCaseInput = {
	id: Nanoid;
	n: number;
};

export class DeleteItemRecurrenceUseCase implements CommandUseCase<DeleteItemRecurrenceUseCaseInput> {
	constructor(
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({ id, n }: DeleteItemRecurrenceUseCaseInput): Promise<void> {
		await this._recurrenceModificationsService.markOccurrenceAsDeleted(
			id,
			n,
		);
	}
}
