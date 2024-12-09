import { NumberValueObject } from "./NumberValueObject";

export type TPriceValueObject = {
	numPrice: number;
	strPrice: string;
};

export class PriceValueObject extends NumberValueObject {
	constructor(price: number) {
		super(price);
	}

	static zero(): PriceValueObject {
		return new PriceValueObject(0);
	}

	negate(): PriceValueObject {
		return new PriceValueObject(-this._value);
	}

	_addCommas(input: string) {
		const inputParts = input.split(".");
		let integerPart = inputParts[0];
		const decimalPart = inputParts.length > 1 ? "." + inputParts[1] : "";
		const rgx = /(\d+)(\d{3})/;
		while (rgx.test(integerPart)) {
			integerPart = integerPart.replace(rgx, "$1,$2");
		}
		return integerPart + decimalPart;
	}

	toString(sign = true, digits = 0): string {
		let formatted = this._addCommas(`${this._value.toFixed(digits)}`);
		if (sign) {
			formatted = `$${formatted}`;
			if (this._value < 0) formatted = `-${formatted}`;
		}
		return formatted;
	}

	static parseInput(
		inputElement: HTMLInputElement,
		hasSign = true,
		digitsCount = 0
	) {
		inputElement.oninput = (e) => {
			e.preventDefault();
			inputElement.value = PriceValueObject.fromString(
				(e.currentTarget as HTMLInputElement).value
			).toString(hasSign, digitsCount);

			if (digitsCount && inputElement.selectionStart) {
				const cursorPosition =
					(e.currentTarget as HTMLInputElement).value.length -
					digitsCount -
					1;
				inputElement.setSelectionRange(cursorPosition, cursorPosition);
			}

			inputElement.focus();
		};
	}

	static fromString(strPrice: string): PriceValueObject {
		const price = parseFloat(strPrice.replace(/[$,]/g, ""));
		return Number.isNaN(price)
			? PriceValueObject.zero()
			: new PriceValueObject(price);
	}

	toNumber(): number {
		return this.valueOf();
	}
}
