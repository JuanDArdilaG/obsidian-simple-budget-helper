import { PriceValueObject } from "@juandardilag/value-objects";
import { FormControl, InputLabel, Input, InputAdornment } from "@mui/material";
import { WithLockField } from "../WithLockField";

export const PriceInput = ({
	id,
	label,
	value,
	onChange,
	isLocked,
	setIsLocked,
}: {
	id: string;
	label: string;
	value: PriceValueObject;
	onChange: (value: PriceValueObject) => void;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
}) => {
	return (
		<WithLockField isLocked={isLocked} setIsLocked={setIsLocked}>
			<FormControl fullWidth variant="standard">
				<InputLabel
					htmlFor={id}
					style={{
						color: "var(--text-normal)",
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
						onChange(PriceValueObject.fromString(e.target.value))
					}
					style={{
						backgroundColor:
							"var(--background-modifier-form-field)",
						color: "var(--text-normal)",
						padding: 5,
					}}
					disabled={isLocked}
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
			</FormControl>
		</WithLockField>
	);
};
