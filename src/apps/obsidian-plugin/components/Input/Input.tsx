import { ReactMoneyInput } from "react-input-price";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { useEffect, useState } from "react";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { LockField } from "../LockField";

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
	dateWithTime,
}: {
	id: string;
	label: string;
	dateWithTime?: boolean;
	value?: T;
	onChange: (value: T) => void;
	error?: string;
	datalist?: string;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
	style?: React.CSSProperties;
}) => {
	const { logger } = useLogger("Input");
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
							onValueChange={(priceVO) =>
								onChange(priceVO as unknown as T)
							}
						/>
					</div>
					{setIsLocked && (
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
					{dateWithTime ? (
						<input
							type="time"
							value={date
								.toTimeString()
								.split(" ")[0]
								.split(":")
								.slice(0, 2)
								.join(":")}
							onChange={(e) => {
								const dateWithTime = new Date(date.getTime());
								const [hour, minute] =
									e.target.value.split(":");
								dateWithTime.setHours(
									parseInt(hour),
									parseInt(minute),
									0,
									0
								);
								logger.debug("modified time in date", {
									timeValue: e.target.value,
									date: dateWithTime,
								});
								setDate(date);
								onChange(dateWithTime as T);
							}}
						/>
					) : undefined}
					{setIsLocked && (
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
