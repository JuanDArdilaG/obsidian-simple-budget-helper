import { useEffect, useState } from "react";
import { Input } from "./Input";

export const useDateInput = ({
	id,
	label,
	initialValue,
	lock,
	setLock,
}: {
	id: string;
	label?: string;
	initialValue?: Date;
	lock?: boolean;
	setLock?: (lock: boolean) => void;
}) => {
	const [date, setDate] = useState(initialValue ?? new Date());

	return {
		DateInput: (
			<Input<Date>
				id={id}
				label={label ?? "Account"}
				value={date}
				onChange={setDate}
				isLocked={lock}
				setIsLocked={setLock ? (lock) => setLock(lock) : undefined}
				// error={errors?.account}
			/>
		),
		date,
	};
};
