import { useState } from "react";
import { DateInput } from "./DateInput";
import { WithLockField } from "../WithLockField";

export const useDateInput = (props?: {
	id?: string;
	label?: string;
	initialValue?: Date;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
	withTime?: boolean;
	error?: string;
}) => {
	const { label, initialValue, lock, setLock, withTime, error } = props ?? {};
	const [date, setDate] = useState(initialValue ?? new Date());

	return {
		DateInput: (
			<WithLockField isLocked={lock} setIsLocked={setLock}>
				<DateInput
					value={date}
					onChange={setDate}
					label={label}
					disabled={lock}
					withTime={withTime}
					error={error}
				/>
			</WithLockField>
		),
		date,
		setDate,
	};
};
