import { IValueObject } from "contexts/Shared/domain";

export abstract class ValueObject<T> implements IValueObject<T> {
	constructor(readonly value: T) {}

	abstract validate(): void;
	abstract toString(): string;
}
