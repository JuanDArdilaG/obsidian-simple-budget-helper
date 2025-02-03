import {
	FormControl,
	InputLabel,
	MenuItem,
	Select as MUISelect,
} from "@mui/material";

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
		<FormControl variant="standard" fullWidth>
			<InputLabel
				id={id + "select-label"}
				style={{ color: "var(--color-base-70)" }}
			>
				{label}
			</InputLabel>
			<MUISelect
				labelId={id + "select-label"}
				id={id + "select"}
				value={value}
				onChange={(e) => onChange(e.target.value as T)}
				style={{ color: "var(--color-base-100)" }}
			>
				{values.map((value) => (
					<MenuItem value={value}>{value}</MenuItem>
				))}
			</MUISelect>
		</FormControl>
		// <div className="horizontal-input">
		// 	<label htmlFor={`${id}-input`}>{label}</label>
		// 	<select
		// 		defaultValue={value}
		// 		onChange={(e) => onChange(e.target.value as T)}
		// 	>
		// 		{values.map((value) => (
		// 			<option value={value}>{value}</option>
		// 		))}
		// 	</select>
		// </div>
	);
};
