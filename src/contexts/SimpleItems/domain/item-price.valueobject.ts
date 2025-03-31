import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { InvalidArgumentError } from "contexts/Shared/domain";

export class ItemPrice extends PriceValueObject {
	validate(value: number): void {
		if (value <= 0)
			throw new InvalidArgumentError(
				"ItemPrice",
				String(value),
				"must be a positive number"
			);
	}
}
