export interface IValueObject<T> {
	value: T;

	validate(): void;
}
