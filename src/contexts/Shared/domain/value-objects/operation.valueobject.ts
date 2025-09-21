import { EnumValueObject } from "@juandardilag/value-objects";

export type OperationType = "income" | "expense" | "transfer";

export class Operation extends EnumValueObject<OperationType> {
	constructor(value: OperationType) {
		super(["income", "expense", "transfer"], value);
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
