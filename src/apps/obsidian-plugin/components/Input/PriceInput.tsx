import { PriceValueObject } from "@juandardilag/value-objects";
import CurrencyInput from "react-currency-input-field";

export const PriceInput = ({
	id,
	value,
	onChange,
	label,
	placeholder,
	prefix,
}: {
	id: string;
	value: PriceValueObject;
	onChange?: (value: PriceValueObject) => void;
	label?: string;
	placeholder?: string;
	prefix?: string;
}) => {
	return (
		<>
			{label && <label htmlFor={id}>{label}</label>}
			<CurrencyInput
				id={id}
				placeholder={placeholder}
				allowDecimals
				decimalsLimit={2}
				decimalScale={2}
				value={value.value}
				onValueChange={(value) =>
					onChange?.(
						PriceValueObject.fromString(value ?? "0", {
							decimals: 2,
							withSign: true,
						})
					)
				}
				prefix={prefix}
			/>
		</>
	);
};
