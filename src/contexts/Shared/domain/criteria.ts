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

interface FilterCriterion<T> {
	value: T | T[];
	operator: Operator;
}

type Filter<T> = T | FilterCriterion<T>;

function makeFilter<T>(
	value: T,
	operator: Operator = "EQUAL"
): FilterCriterion<T> {
	return { value, operator };
}

interface IOrder {
	field: string;
	direction: "ASC" | "DESC" | "NONE";
}

export class Criteria<T> {
	readonly filters: Record<string, Filter<T>>;
	readonly orders: IOrder[];
	limit?: number;
	offset?: number;
	readonly resultType: "ONE" | "MANY";

	constructor(
		filters: Record<string, Filter<T>> = {},
		orders: IOrder[] = [],
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
		field: string,
		value: any,
		operator: Operator = "EQUAL"
	): Criteria<T> {
		const filter = makeFilter(value, operator);
		this.filters[field] = filter;
		return this;
	}

	orderBy(
		field: string,
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
