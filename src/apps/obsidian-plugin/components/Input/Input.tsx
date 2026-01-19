import { TextField } from "@mui/material";

type InputValue = string | number;
export const Input = <T extends NonNullable<InputValue>>({
	id,
	style,
	label,
	value,
	onChange,
	onBlur,
	error,
}: {
	id: string;
	label: string;
	value?: T;
	onChange: (value: T) => void;
	onBlur?: () => void;
	style?: React.CSSProperties;
	error?: string;
}) => {
	return (
		<TextField
			id={id}
			style={style}
			label={label}
			variant="standard"
			value={value}
			onChange={(e) => onChange(e.target.value as T)}
			onBlur={onBlur}
			type={typeof value === "number" ? "number" : "text"}
			error={!!error}
			helperText={error}
			slotProps={{
				inputLabel: {
					style: {
						zIndex: 1,
						paddingLeft: 15,
						paddingTop: 5,
						color: "var(--text-normal)",
					},
				},
			}}
		/>
	);
};
