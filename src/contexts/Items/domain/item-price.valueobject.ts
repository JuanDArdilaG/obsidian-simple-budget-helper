import { PriceValueObject } from "@juandardilag/value-objects";
import { InvalidArgumentError } from "contexts/Shared/domain";

export class ItemPrice extends PriceValueObject {
	validate(): void {
		if (this.value <= 0)
			throw new InvalidArgumentError(
				"ItemPrice",
				String(this.value),
				"must be a positive number"
			);
	}
}
