import { ReactMoneyInput } from "react-input-price";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useEffect, useState } from "react";
import { LockField } from "./LockField";

type InputValue = PriceValueObject | string | number | Date;
export const Input = <T extends NonNullable<InputValue>>({
	id,
	label,
	value,
	onChange,
	error,
	datalist,
	isLocked,
	setIsLocked,
	style,
}: {
	id: string;
	label: string;
	value?: T;
	onChange: (value: T) => void;
	error?: string;
	datalist?: string;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
	style?: React.CSSProperties;
}) => {
	const [date, setDate] = useState<Date>(new Date());
	useEffect(() => {
		if (value instanceof Date) {
			setDate(value);
		}
	}, [value]);

	return (
		<div style={style}>
			{value instanceof PriceValueObject ? (
				<div
					style={{
						display: "flex",
						gap: "20px",
						alignItems: "center",
					}}
				>
					<div
						style={
							error
								? { border: "1px solid var(--color-red)" }
								: {}
						}
					>
						<ReactMoneyInput
							id={`${id}-input-react`}
							initialValue={value?.toNumber() ?? undefined}
							onValueChange={(priceVO) => onChange(priceVO as T)}
						/>
					</div>
					{isLocked !== undefined && (
						<LockField
							setIsLocked={setIsLocked}
							isLocked={isLocked}
						/>
					)}
				</div>
			) : value instanceof Date ? (
				<div
					style={{
						display: "flex",
						gap: "20px",
						alignItems: "center",
					}}
				>
					<input
						type="date"
						value={new Intl.DateTimeFormat("en-CA", {
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
						}).format(date)}
						onChange={(e) => {
							console.log({ dateValue: e.target.value });
							const [year, month, day] =
								e.target.value.split("-");
							const newDate = new Date(
								parseInt(year),
								parseInt(month) - 1,
								parseInt(day),
								date.getHours(),
								date.getMinutes(),
								0
							);
							setDate(newDate);
							onChange(newDate as T);
						}}
					/>
					<input
						type="time"
						value={date.toTimeString().split(".")[0].split(" ")[0]}
						onChange={(e) => {
							const dateWithTime = new Date(date.getTime());
							const [hour, minute] = e.target.value.split(":");
							dateWithTime.setHours(
								parseInt(hour),
								parseInt(minute),
								0,
								0
							);
							console.log({
								timeValue: e.target.value,
								date: dateWithTime,
							});
							setDate(date);
							onChange(dateWithTime as T);
						}}
					/>
					{isLocked !== undefined && (
						<LockField
							setIsLocked={setIsLocked}
							isLocked={isLocked}
						/>
					)}
				</div>
			) : (
				<input
					id={`${id}-input`}
					placeholder={label}
					type={"text"}
					value={value}
					onChange={(e) => onChange(e.target.value as T)}
					style={
						error
							? {
									border: "1px solid var(--color-red)",
									width: "100%",
							  }
							: { width: "100%" }
					}
					list={datalist}
				/>
			)}
		</div>
	);
};
