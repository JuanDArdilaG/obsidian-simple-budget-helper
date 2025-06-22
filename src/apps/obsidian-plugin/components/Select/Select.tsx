import {
	FormControl,
	InputLabel,
	MenuItem,
	Select as MuiSelect,
	FormHelperText,
} from "@mui/material";
import { JSX, useEffect, useState } from "react";
import { WithLockField } from "../WithLockField";

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
	value?: T;
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
						<MenuItem key={v} value={v}>
							{v}
						</MenuItem>
				  ))
				: Object.keys(values).map(
						(key) => (
							<MenuItem key={key} value={key}>
								{values[key]}
							</MenuItem>
						),
						[]
				  )
		);
	}, [values]);

	return (
		<WithLockField
			isLocked={isLocked}
			setIsLocked={setIsLocked}
			style={{ width: "100%" }}
		>
			<FormControl fullWidth error={!!error}>
				<InputLabel
					id={`${id}-label`}
					style={{
						color: error
							? "var(--text-error)"
							: "var(--text-muted)",
						paddingLeft: 0,
						padding: 5,
					}}
				>
					{label}
				</InputLabel>
				<MuiSelect
					labelId={`${id}-label`}
					id={id}
					value={value}
					label={label}
					variant="standard"
					onChange={(e) => onChange(e.target.value as T)}
					disabled={isLocked}
					style={{
						color: "var(--text-normal)",
						backgroundColor:
							"var(--background-modifier-form-field)",
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
		</WithLockField>
	);
};
