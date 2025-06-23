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
import { ItemRecurrence, ItemRecurrenceFrequency } from "contexts/Items/domain";
import { useEffect, useState } from "react";

type FrequencyType = "daily" | "weekly" | "monthly" | "yearly" | "other";

export const useCreateRecurrenceForm = ({
	recurrence,
	showErrors,
}: {
	recurrence?: ItemRecurrence;
	showErrors?: boolean;
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
	const [frequencyType, setFrequencyType] = useState<FrequencyType>("other");

	const [errors, setErrors] = useState<{
		recurrences: string | undefined;
		frequencyString: string | undefined;
	}>({
		recurrences: undefined,
		frequencyString: undefined,
	});
	const [isValid, setIsValid] = useState(false);

	useEffect(() => {
		if (recurrenceType === "oneTime") {
			setRecurrences(1);
		} else if (recurrenceType === "infinite") {
			setRecurrences(-1);
		}
	}, [recurrenceType]);

	useEffect(() => {
		if (frequencyType !== "other") {
			setFrequencyString(frequencyType);
		}
	}, [frequencyType]);

	useEffect(() => {
		const newErrors: {
			recurrences: string | undefined;
			frequencyString: string | undefined;
		} = {
			recurrences: undefined,
			frequencyString: undefined,
		};
		let formIsValid = true;

		if (type === "byTotal" && recurrenceType === "other") {
			if (!recurrences || recurrences <= 0) {
				newErrors.recurrences = "Must be greater than 0";
				formIsValid = false;
			}
		}

		if (recurrenceType !== "oneTime" && frequencyType === "other") {
			if (!frequencyString.trim()) {
				newErrors.frequencyString = "Frequency is required";
				formIsValid = false;
			} else {
				const freq = new ItemRecurrenceFrequency(frequencyString);
				const freqObj = freq.toObject();
				if (
					!freqObj?.days.value &&
					!freqObj?.months.value &&
					!freqObj?.years.value
				) {
					newErrors.frequencyString = "Invalid frequency format";
					formIsValid = false;
				}
			}
		}

		setErrors(newErrors);
		setIsValid(formIsValid);
	}, [type, recurrenceType, recurrences, frequencyType, frequencyString]);

	const RecurrenceForm = (
		<div className="recurrence-form-container">
			<Typography variant="h6" gutterBottom>
				Recurrence Config
			</Typography>
			<div className="recurrence-form-controls">
				<FormControl component="fieldset">
					<FormLabel component="legend">Type</FormLabel>
					<RadioGroup
						row
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
							control={<Radio size="small" />}
							label="By Total"
						/>
						<FormControlLabel
							value="byDate"
							control={<Radio size="small" />}
							label="By Date"
						/>
					</RadioGroup>
				</FormControl>

				<div className="recurrence-type-details">
					{type === "byDate" ? (
						<DateInput value={untilDate} onChange={setUntilDate} />
					) : (
						<FormControl component="fieldset">
							<FormLabel component="legend">Total</FormLabel>
							<RadioGroup
								row
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
									control={<Radio size="small" />}
									label="1"
								/>
								<FormControlLabel
									value="infinite"
									control={<Radio size="small" />}
									label="∞"
								/>
								<FormControlLabel
									value="other"
									control={<Radio size="small" />}
									label="Other"
								/>
							</RadioGroup>
							{recurrenceType === "other" && (
								<Input<number>
									id="recurrences"
									label="Times"
									value={recurrences}
									onChange={setRecurrences}
									error={
										showErrors
											? errors.recurrences
											: undefined
									}
								/>
							)}
						</FormControl>
					)}
				</div>
			</div>

			{recurrenceType !== "oneTime" && (
				<FormControl component="fieldset" className="frequency-control">
					<FormLabel component="legend">Frequency</FormLabel>
					<RadioGroup
						row
						value={frequencyType}
						onChange={(e) =>
							setFrequencyType(
								(e.target as HTMLInputElement)
									.value as FrequencyType
							)
						}
					>
						<FormControlLabel
							value="daily"
							control={<Radio size="small" />}
							label="Daily"
						/>
						<FormControlLabel
							value="weekly"
							control={<Radio size="small" />}
							label="Weekly"
						/>
						<FormControlLabel
							value="monthly"
							control={<Radio size="small" />}
							label="Monthly"
						/>
						<FormControlLabel
							value="yearly"
							control={<Radio size="small" />}
							label="Yearly"
						/>
						<FormControlLabel
							value="other"
							control={<Radio size="small" />}
							label="Other"
						/>
					</RadioGroup>
					{frequencyType === "other" && (
						<Input<string>
							id="frequency"
							label="Frequency String"
							value={frequencyString}
							onChange={setFrequencyString}
							error={
								showErrors ? errors.frequencyString : undefined
							}
						/>
					)}
				</FormControl>
			)}
		</div>
	);
	return {
		RecurrenceForm,
		untilDate: type === "byDate" ? untilDate : undefined,
		recurrenceType,
		recurrences,
		frequencyString,
		isValid,
	};
};
