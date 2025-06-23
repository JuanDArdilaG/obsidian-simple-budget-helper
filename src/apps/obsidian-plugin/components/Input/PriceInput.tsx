import { PriceValueObject } from "@juandardilag/value-objects";
import {
	FormControl,
	FormHelperText,
	Input,
	InputAdornment,
	InputLabel,
} from "@mui/material";
import { WithLockField } from "../WithLockField";

export const PriceInput = ({
	id,
	label,
	value,
	onChange,
	isLocked,
	setIsLocked,
	error,
	disabled,
}: {
	id: string;
	label: string;
	value: PriceValueObject;
	onChange?: (value: PriceValueObject) => void;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
	error?: string;
	disabled?: boolean;
}) => {
	return (
		<WithLockField isLocked={isLocked} setIsLocked={setIsLocked}>
			<FormControl fullWidth variant="standard" error={!!error}>
				<InputLabel
					htmlFor={id}
					style={{
						color: error
							? "var(--text-error)"
							: "var(--text-normal)",
						paddingLeft: 15,
					}}
				>
					{label}
				</InputLabel>
				<Input
					id={id}
					className="no-styles"
					startAdornment={
						<InputAdornment position="start">
							<span style={{ color: "var(--text-normal)" }}>
								$
							</span>
						</InputAdornment>
					}
					value={value.toString()}
					onChange={(e) =>
						onChange?.(PriceValueObject.fromString(e.target.value))
					}
					style={{
						backgroundColor:
							"var(--background-modifier-form-field)",
						color: "var(--text-normal)",
						padding: 5,
						borderColor: error ? "var(--text-error)" : undefined,
					}}
					disabled={isLocked || disabled}
					slotProps={{
						input: {
							style: {
								backgroundColor:
									"var(--background-modifier-form-field)",
								border: "none",
								borderRadius: 0,
								paddingLeft: 0,
							},
						},
					}}
				/>
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
