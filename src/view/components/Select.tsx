import { LockField } from "./LockField";

export const Select = <T extends string>({
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
	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<label htmlFor={`${id}-input`}>{label}</label>
			<select
				defaultValue={value}
				onChange={(e) => onChange(e.target.value as T)}
				style={error ? { border: "1px solid red" } : {}}
			>
				{Array.isArray(values)
					? values.map((value) => (
							<option value={value}>{value}</option>
					  ))
					: Object.keys(values).map((key) => (
							<option value={key}>{values[key]}</option>
					  ))}
			</select>

			{isLocked !== undefined && (
				<LockField setIsLocked={setIsLocked} isLocked={isLocked} />
			)}
		</div>
	);
};
