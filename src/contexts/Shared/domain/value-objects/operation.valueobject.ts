import { EnumValueObject } from "contexts/Shared/domain/value-objects/enum.valueobject";

export type OperationType = "income" | "expense" | "transfer";

export class Operation extends EnumValueObject<string> {
	constructor(value: OperationType) {
		super(
			"Operation",
			["income", "expense", "transfer"],
			(val) => val,
			value
		);
	}

	static expense(): Operation {
		return new Operation("expense");
	}

	static income(): Operation {
		return new Operation("income");
	}

	static transfer(): Operation {
		return new Operation("transfer");
	}

	isExpense(): boolean {
		return this.value === "expense";
	}

	isIncome(): boolean {
		return this.value === "income";
	}

	isTransfer(): boolean {
		return this.value === "transfer";
	}
}
