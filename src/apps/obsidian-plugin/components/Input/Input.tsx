import { TextField } from "@mui/material";
import { WithLockField } from "../WithLockField";

type InputValue = string | number;
export const Input = <T extends NonNullable<InputValue>>({
	id,
	label,
	value,
	onChange,
	onBlur,
	isLocked,
	setIsLocked,
	style,
	error,
}: {
	id: string;
	label: string;
	value?: T;
	onChange: (value: T) => void;
	onBlur?: () => void;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
	style?: React.CSSProperties;
	error?: string;
}) => {
	return (
		<WithLockField
			isLocked={isLocked}
			setIsLocked={setIsLocked}
			style={style}
		>
			<TextField
				id={id}
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
		</WithLockField>
	);
};
