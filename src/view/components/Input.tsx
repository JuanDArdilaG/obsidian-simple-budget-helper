import { ReactMoneyInput } from "react-input-price";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

type InputValue = PriceValueObject | string | number | Date;
export const Input = <T extends NonNullable<InputValue>>({
	id,
	label,
	value,
	onChange,
	error,
}: {
	id: string;
	label: string;
	value?: T;
	onChange: (value: T) => void;
	error?: "required";
}) => {
	const [date, setDate] = useState<Dayjs>(dayjs());
	useEffect(() => {
		if (value instanceof Date) {
			setDate(dayjs(value));
		}
	}, []);

	return (
		<div>
			{value instanceof PriceValueObject ? (
				<div style={error ? { border: "1px solid red" } : {}}>
					<ReactMoneyInput
						id={`${id}-input-react`}
						initialValue={value?.toNumber() ?? undefined}
						onValueChange={(priceVO) => onChange(priceVO as T)}
						CustomInput={TextField}
						CustomInputProps={{
							fullWidth: true,
							placeholder: label,
							variant: "standard",
						}}
					/>
				</div>
			) : value instanceof Date ? (
				<div style={{ display: "flex", gap: "20px" }}>
					<DatePicker
						label={label}
						value={dayjs(date)}
						onChange={(daysjsDate) => {
							if (daysjsDate) setDate(daysjsDate);
						}}
					/>
					<TimePicker
						value={date}
						onChange={(daysjsTime) => {
							if (daysjsTime) setDate(daysjsTime);
						}}
					/>
				</div>
			) : (
				<TextField
					id={`${id}-input`}
					placeholder={label}
					type={"text"}
					value={value}
					onChange={(e) => onChange(e.target.value as T)}
					style={error ? { border: "1px solid red" } : {}}
					fullWidth
					variant="standard"
				/>
			)}
		</div>
	);
};
