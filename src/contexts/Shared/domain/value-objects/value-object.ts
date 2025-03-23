import { IValueObject } from "contexts/Shared/domain/value-objects/value-object.interface";

export abstract class ValueObject<T> implements IValueObject<T> {
	constructor(readonly value: T) {}

	abstract validate(): void;
	abstract toString(): string;
}
