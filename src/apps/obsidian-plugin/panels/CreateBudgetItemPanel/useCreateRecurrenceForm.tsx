import {
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { ItemRecurrence } from "contexts/Items/domain";
import { useEffect, useState } from "react";

export const useCreateRecurrenceForm = ({
	recurrence,
}: {
	recurrence?: ItemRecurrence;
}) => {
	const [type, setType] = useState(
		recurrence?.untilDate ? "byDate" : "byTotal"
	);
	const [frequencyString, setFrequencyString] = useState(
		recurrence?.frequency?.value ?? ""
	);
	const [untilDate, setUntilDate] = useState<Date>(
		recurrence?.untilDate?.value ?? new Date()
	);
	const [recurrenceType, setRecurrencesType] = useState<
		"oneTime" | "infinite" | "other"
	>(
		recurrence?.totalRecurrences === -1
			? "infinite"
			: recurrence?.totalRecurrences === 1
			? "oneTime"
			: "other"
	);
	const [recurrences, setRecurrences] = useState(0);

	useEffect(() => {
		if (recurrenceType === "oneTime") {
			setRecurrences(1);
		} else if (recurrenceType === "infinite") {
			setRecurrences(-1);
		}
	}, [recurrenceType]);

	const RecurrenceForm = (
		<>
			<Typography variant="h6">Recurrence Config</Typography>
			<div
				style={{
					display: "flex",
					justifyContent: "space-around",
				}}
			>
				<FormControl>
					<FormLabel id="demo-row-radio-buttons-group-label">
						Type
					</FormLabel>
					<RadioGroup
						row
						aria-labelledby="demo-row-radio-buttons-group-label"
						name="row-radio-buttons-group"
						value={type}
						onChange={(e) =>
							setType(
								(e.target as HTMLInputElement).value as
									| "byDate"
									| "byTotal"
							)
						}
					>
						<FormControlLabel
							value="byTotal"
							control={<Radio />}
							label="By Total"
						/>
						<FormControlLabel
							value="byDate"
							control={<Radio />}
							label="By Date"
						/>
					</RadioGroup>
				</FormControl>
				{type === "byDate" ? (
					<DateInput value={untilDate} onChange={setUntilDate} />
				) : (
					<FormControl>
						<FormLabel id="demo-row-radio-buttons-group-label">
							Total
						</FormLabel>
						<RadioGroup
							row
							aria-labelledby="demo-row-radio-buttons-group-label"
							name="row-radio-buttons-group"
							value={recurrenceType}
							onChange={(e) =>
								setRecurrencesType(
									(e.target as HTMLInputElement).value as
										| "infinite"
										| "oneTime"
										| "other"
								)
							}
						>
							<FormControlLabel
								value="oneTime"
								control={<Radio />}
								label="1"
							/>
							<FormControlLabel
								value="infinite"
								control={<Radio />}
								label="∞"
							/>
							<FormControlLabel
								value="other"
								control={<Radio />}
								label="Other"
							/>
						</RadioGroup>
						{recurrenceType === "other" && (
							<Input<number>
								id="frequency"
								label=""
								value={recurrences}
								onChange={setRecurrences}
							/>
						)}
					</FormControl>
				)}
			</div>
			{recurrenceType !== "oneTime" && (
				<Input<string>
					id="frequency"
					label="Frequency String"
					value={frequencyString}
					onChange={setFrequencyString}
				/>
			)}
		</>
	);
	return {
		RecurrenceForm,
		untilDate: type === "byDate" ? untilDate : undefined,
		recurrenceType,
		recurrences,
		frequencyString,
	};
};
