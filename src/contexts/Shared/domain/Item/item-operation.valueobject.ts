import { Operation, OperationType } from "contexts/Shared/domain/value-objects";

export class ItemOperation {
	private constructor(private readonly _type: Operation) {}

	static expense(): ItemOperation {
		return new ItemOperation(Operation.expense());
	}

	static income(): ItemOperation {
		return new ItemOperation(Operation.income());
	}

	static transfer(): ItemOperation {
		return new ItemOperation(Operation.transfer());
	}

	get type(): Operation {
		return this._type;
	}

	static fromPrimitives({ type }: ItemOperationPrimitives): ItemOperation {
		return new ItemOperation(new Operation(type));
	}

	toPrimitives(): ItemOperationPrimitives {
		return {
			type: this._type.value,
		};
	}
}

export type ItemOperationPrimitives = {
	type: OperationType;
};
