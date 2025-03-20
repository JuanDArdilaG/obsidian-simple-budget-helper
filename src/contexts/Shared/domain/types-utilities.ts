type DefaultValue<T> = {
	[K in keyof T]-?: T[K] extends string
		? string
		: T[K] extends number
		? number
		: T[K] extends boolean
		? boolean
		: T[K] extends Date
		? Date
		: T[K] extends Array<infer U>
		? Array<DefaultValue<U>>
		: T[K] extends object
		? DefaultValue<T[K]>
		: T[K];
};

/**
 * Creates an object with default values for each property based on its type
 * @param type - A sample of the type, only used for type inference
 * @returns An object with default values
 */
export function createDefault<T extends object>(
	type: T = {} as T
): DefaultValue<T> {
	// This is just for type inference, we don't actually use the parameter
	const result = {} as DefaultValue<T>;

	// Get all properties from the type
	const properties = Object.getOwnPropertyNames(type) as Array<keyof T>;

	// Set default values based on property types
	for (const key of properties) {
		const propType = typeof (type as any)[key];

		switch (propType) {
			case "string":
				result[key] = "" as any;
				break;
			case "number":
				result[key] = 0 as any;
				break;
			case "boolean":
				result[key] = false as any;
				break;
			case "object":
				// Check if it's a Date
				if ((type as any)[key] instanceof Date) {
					result[key] = new Date() as any;
				} else if (Array.isArray((type as any)[key])) {
					result[key] = [] as any;
				} else {
					result[key] = createDefault((type as any)[key]) as any;
				}
				break;
			default:
				result[key] = undefined as any;
		}
	}

	return result;
}
