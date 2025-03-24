import { JSX, useEffect, useState } from "react";
import { LockField } from "./LockField";

export const Select = <T extends string | number>({
	id,
	label,
	value,
	values,
	onChange,
	isLocked,
	setIsLocked,
	error,
}: {
	id: string;
	label: string;
	value: T;
	values: T[] | { [key: string]: T };
	onChange: (value: T) => void;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
	error?: string;
}) => {
	const [options, setOptions] = useState<JSX.Element[]>([]);
	useEffect(() => {
		setOptions(
			Array.isArray(values)
				? values.map((v) => (
						<option key={v} value={v}>
							{v}
						</option>
				  ))
				: Object.keys(values).map(
						(key) => (
							<option key={value} value={key}>
								{values[key]}
							</option>
						),
						[]
				  )
		);
	}, [values, value]);

	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<label htmlFor={`${id}-input`}>{label}</label>
			<select
				defaultValue={value}
				onChange={(e) =>
					onChange(
						(typeof value === "string"
							? e.target.value
							: Number(e.target.value)) as T
					)
				}
				style={error ? { border: "1px solid red" } : {}}
			>
				{options}
			</select>

			{setIsLocked && (
				<LockField setIsLocked={setIsLocked} isLocked={isLocked} />
			)}
		</div>
	);
};
