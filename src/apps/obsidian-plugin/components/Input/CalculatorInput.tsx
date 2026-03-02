import { Calculator } from "lucide-react";
import { evaluate } from "mathjs";
import React, { useEffect, useState } from "react";
import { PriceVO } from "../../../../contexts/Shared/domain/value-objects/price.vo";

interface CalculatorInputProps extends Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange"
> {
	value: number;
	onChange: (value: number) => void;
}

export function CalculatorInput({
	value,
	onChange,
	className,
	onBlur,
	onKeyDown,
	...props
}: Readonly<CalculatorInputProps>) {
	const [displayValue, setDisplayValue] = useState(
		new PriceVO(value).toString(),
	);
	const [preview, setPreview] = useState<number | null>(null);
	// Sync with external value changes (e.g. form resets)
	useEffect(() => {
		const currentParsed = PriceVO.fromString(displayValue).value;

		// Only update if the parsed value differs to avoid overwriting user typing
		if (Number.isNaN(currentParsed) || currentParsed !== value) {
			setDisplayValue(new PriceVO(value).toString());
		}
	}, [value]);

	const handleEvaluate = () => {
		try {
			const cleanedValue = displayValue
				.replaceAll(",", "")
				.replaceAll("$", "");
			if (cleanedValue.trim() === "") {
				onChange(0);
				setDisplayValue("");
				setPreview(null);
				return;
			}
			// Evaluate the expression
			const result = evaluate(cleanedValue);
			if (typeof result === "number" && !Number.isNaN(result)) {
				// Round to 2 decimal places to avoid floating point issues
				const roundedResult = Math.round(result * 100) / 100;
				onChange(roundedResult);
				setDisplayValue(new PriceVO(roundedResult).toString());
				setPreview(null);
			}
		} catch (e) {
			// Invalid expression, do nothing
			console.error(e);
			setPreview(null);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setDisplayValue(val);
		// Try to show preview
		try {
			const cleanedValue = val.replaceAll(",", "").replaceAll("$", "");
			if (cleanedValue.trim() === "") {
				onChange(0);
				setDisplayValue("");
				setPreview(null);
				return;
			}
			const result = evaluate(cleanedValue);
			if (
				typeof result === "number" &&
				!Number.isNaN(result) &&
				result.toString() !== cleanedValue
			) {
				const roundedResult = Math.round(result * 100) / 100;
				setPreview(roundedResult);
			} else {
				setPreview(null);
			}
		} catch {
			setPreview(null);
		}
	};

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		handleEvaluate();
		if (onBlur) onBlur(e);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleEvaluate();
		}
		if (onKeyDown) onKeyDown(e);
	};

	return (
		<div className="relative flex-1 w-full">
			<input
				type="text"
				value={displayValue}
				onChange={handleChange}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				className={className}
				{...props}
			/>
			{preview !== null && (
				<div className="absolute left-0 top-full mt-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded pointer-events-none flex items-center gap-1 shadow-sm border border-indigo-100 z-20 whitespace-nowrap">
					<Calculator size={10} />
					<span>= {preview}</span>
				</div>
			)}
		</div>
	);
}
