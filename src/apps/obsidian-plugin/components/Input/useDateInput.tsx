import { useState } from "react";
import { DateInput } from "./DateInput";

export const useDateInput = (props?: {
	id?: string;
	label?: string;
	initialValue?: Date;
	withTime?: boolean;
	error?: string;
}) => {
	const { label, initialValue, withTime, error } = props ?? {};
	const [date, setDate] = useState(initialValue ?? new Date());

	return {
		DateInput: (
			<DateInput
				value={date}
				onChange={setDate}
				label={label}
				withTime={withTime}
				error={error}
			/>
		),
		date,
		setDate,
	};
};
