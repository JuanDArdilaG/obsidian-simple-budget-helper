import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

export const DateInput = ({
	label,
	value,
	onChange,
	disabled,
}: {
	label?: string;
	value?: Date;
	onChange: (value: Date) => void;
	disabled?: boolean;
}) => {
	return (
		<DateTimePicker
			className="date-time-picker"
			views={["year", "month", "day", "hours", "minutes"]}
			slotProps={{
				actionBar: {
					actions: ["today", "accept"],
				},
				desktopPaper: {
					style: {
						color: "var(--text-normal)",
						background: "var(--background-primary-alt)",
					},
				},
				field: {
					style: {
						backgroundColor:
							"var(--background-modifier-form-field)",
					},
				},
			}}
			label={label}
			value={dayjs(value)}
			disabled={disabled}
			onChange={(newValue) => {
				if (newValue) {
					onChange(newValue.toDate());
				}
			}}
		/>
	);
};
