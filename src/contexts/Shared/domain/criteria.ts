type Operator =
	| "EQUAL"
	| "GREATER_THAN"
	| "LESS_THAN"
	| "GREATER_THAN_OR_EQUAL"
	| "LESS_THAN_OR_EQUAL"
	| "NOT_EQUAL"
	| "IN"
	| "NOT_IN"
	| "LIKE"
	| "BETWEEN";

interface FilterCriterion {
	value: string | number | Date | undefined;
	operator: Operator;
}

type Filter = FilterCriterion;

function makeFilter(
	value: string | number | Date | undefined,
	operator: Operator = "EQUAL"
): FilterCriterion {
	return { value, operator };
}

interface IOrder<T> {
	field: keyof T;
	direction: "ASC" | "DESC" | "NONE";
}

export class Criteria<T> {
	readonly filters: Record<keyof T, Filter>;
	readonly orders: IOrder<T>[];
	limit?: number;
	offset?: number;
	readonly resultType: "ONE" | "MANY";

	constructor(
		filters: Record<keyof T, Filter> = {} as Record<keyof T, Filter>,
		orders: IOrder<T>[] = [],
		limit?: number,
		offset?: number,
		resultType: "ONE" | "MANY" = "MANY"
	) {
		this.filters = filters;
		this.orders = orders;
		this.limit = limit;
		this.offset = offset;
		this.resultType = resultType;
	}

	where(
		field: keyof T,
		value: string | number | Date | undefined,
		operator: Operator = "EQUAL"
	): Criteria<T> {
		const filter = makeFilter(value, operator);
		this.filters[field] = filter;
		return this;
	}

	orderBy(
		field: keyof T,
		direction: "ASC" | "DESC" | "NONE" = "ASC"
	): Criteria<T> {
		if (direction === "NONE") this.orders.push({ field, direction });
		return this;
	}

	take(limit: number): Criteria<T> {
		this.limit = limit;
		return this;
	}

	skip(offset: number): Criteria<T> {
		this.offset = offset;
		return this;
	}
}
