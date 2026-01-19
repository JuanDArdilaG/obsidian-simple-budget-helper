import {
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select as MuiSelect,
} from "@mui/material";
import { JSX, useEffect, useState } from "react";

export const Select = <T,>({
	id,
	label,
	value,
	values,
	onChange,
	error,
	getOptionLabel,
	getOptionValue,
}: {
	id: string;
	label: string;
	value?: string;
	values: T[];
	onChange: (value: string) => void;
	error?: string;
	getOptionLabel?: (option: T) => string;
	getOptionValue?: (option: T) => string;
}) => {
	const [options, setOptions] = useState<JSX.Element[]>([]);
	useEffect(() => {
		setOptions([
			<MenuItem key="" value=""></MenuItem>,
			...values
				.toSorted((a, b) =>
					(getOptionLabel
						? getOptionLabel(a)
						: String(a)
					).localeCompare(
						getOptionLabel ? getOptionLabel(b) : String(b),
					),
				)
				.map((v) => (
					<MenuItem
						key={getOptionValue ? getOptionValue(v) : String(v)}
						value={getOptionValue ? getOptionValue(v) : String(v)}
					>
						{getOptionLabel ? getOptionLabel(v) : String(v)}
					</MenuItem>
				)),
		]);
	}, [values, getOptionLabel, getOptionValue]);

	return (
		<FormControl fullWidth error={!!error}>
			<InputLabel
				id={`${id}-label`}
				style={{
					color: error ? "var(--text-error)" : "var(--text-muted)",
					paddingLeft: 0,
					padding: 5,
				}}
			>
				{label}
			</InputLabel>
			<MuiSelect
				labelId={`${id}-label`}
				id={id}
				value={value || ""}
				label={label}
				variant="standard"
				onChange={(e) => onChange(e.target.value)}
				style={{
					color: "var(--text-normal)",
					backgroundColor: "var(--background-modifier-form-field)",
					padding: 5,
					paddingLeft: 15,
				}}
				slotProps={{
					input: {
						style: { padding: 5 },
					},
				}}
			>
				{options}
			</MuiSelect>
			{error && (
				<FormHelperText
					style={{ color: "var(--text-error)", marginLeft: 0 }}
				>
					{error}
				</FormHelperText>
			)}
		</FormControl>
	);
};
