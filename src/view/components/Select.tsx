export const Select = <T extends string>({
	id,
	label,
	value,
	values,
	onChange,
}: {
	id: string;
	label: string;
	value: T;
	values: T[];
	onChange: (value: T) => void;
}) => {
	return (
		<div style={{ display: "flex", flexDirection: "column" }}>
			<label htmlFor={`${id}-input`}>{label}</label>
			<select
				defaultValue={value}
				onChange={(e) => onChange(e.target.value as T)}
			>
				{values.map((value) => (
					<option value={value}>{value}</option>
				))}
			</select>
		</div>
	);
};
