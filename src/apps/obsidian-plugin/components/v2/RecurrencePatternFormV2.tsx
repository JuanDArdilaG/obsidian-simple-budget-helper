import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import {
	Alert,
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	FormControl,
	FormControlLabel,
	FormLabel,
	InputAdornment,
	Paper,
	Radio,
	RadioGroup,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	ItemRecurrenceFrequency,
	RecurrencePattern,
	RecurrenceType,
	ScheduledTransactionDate,
} from "../../../../contexts/ScheduledTransactions/domain";

export interface RecurrencePatternFormProps {
	initialPattern?: RecurrencePattern;
	onChange: (pattern: RecurrencePattern) => void;
	onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

interface FrequencyPreset {
	label: string;
	value: string;
	description: string;
}

const FREQUENCY_PRESETS: FrequencyPreset[] = [
	{ label: "Daily", value: "1d", description: "Every day" },
	{ label: "Weekly", value: "1w", description: "Every week" },
	{ label: "Bi-weekly", value: "2w", description: "Every 2 weeks" },
	{ label: "Monthly", value: "1mo", description: "Every month" },
	{ label: "Quarterly", value: "3mo", description: "Every 3 months" },
	{ label: "Semi-annually", value: "6mo", description: "Every 6 months" },
	{ label: "Yearly", value: "1y", description: "Every year" },
];

export const RecurrencePatternFormV2: React.FC<RecurrencePatternFormProps> = ({
	initialPattern,
	onChange,
	onValidationChange,
}) => {
	const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
		initialPattern?.type ?? RecurrenceType.ONE_TIME
	);
	const [startDate, setStartDate] = useState<Dayjs>(
		dayjs(initialPattern?.startDate.value ?? new Date())
	);
	const [endDate, setEndDate] = useState<Dayjs | null>(
		initialPattern?.endDate ? dayjs(initialPattern.endDate.value) : null
	);
	const [maxOccurrences, setMaxOccurrences] = useState<number>(
		initialPattern?.maxOccurrences?.value ?? 10
	);
	const [frequencyPreset, setFrequencyPreset] = useState<string>(
		initialPattern?.frequency?.value ?? "1w"
	);
	const [customFrequency, setCustomFrequency] = useState<string>("");
	const [useCustomFrequency, setUseCustomFrequency] =
		useState<boolean>(false);

	// Validation state
	const [errors, setErrors] = useState<string[]>([]);

	const validatePattern = useCallback(
		(
			type: RecurrenceType,
			start: Dayjs,
			frequency?: string,
			end?: Dayjs | null,
			maxOcc?: number
		): string[] => {
			const validationErrors: string[] = [];

			if (type !== RecurrenceType.ONE_TIME) {
				if (frequency) {
					try {
						new ItemRecurrenceFrequency(frequency);
					} catch {
						validationErrors.push("Invalid frequency format");
					}
				} else {
					validationErrors.push(
						"Frequency is required for recurring items"
					);
				}
			}

			if (
				type === RecurrenceType.UNTIL_DATE &&
				(!end || end.isBefore(start) || end.isSame(start))
			) {
				validationErrors.push("End date must be after start date");
			}

			if (
				type === RecurrenceType.N_OCCURRENCES &&
				(!maxOcc || maxOcc <= 0)
			) {
				validationErrors.push(
					"Number of occurrences must be greater than 0"
				);
			}

			return validationErrors;
		},
		[]
	);

	const createPattern = useCallback(() => {
		const startDateVO = new ScheduledTransactionDate(startDate.toDate());
		const effectiveFrequency = useCustomFrequency
			? customFrequency
			: frequencyPreset;

		switch (recurrenceType) {
			case RecurrenceType.ONE_TIME:
				return RecurrencePattern.oneTime(startDateVO);

			case RecurrenceType.INFINITE:
				return RecurrencePattern.infinite(
					startDateVO,
					new ItemRecurrenceFrequency(effectiveFrequency)
				);

			case RecurrenceType.UNTIL_DATE:
				return RecurrencePattern.untilDate(
					startDateVO,
					new ItemRecurrenceFrequency(effectiveFrequency),
					new DateValueObject(endDate!.toDate())
				);

			case RecurrenceType.N_OCCURRENCES:
				return RecurrencePattern.untilNOccurrences(
					startDateVO,
					new ItemRecurrenceFrequency(effectiveFrequency),
					new NumberValueObject(maxOccurrences)
				);

			default:
				throw new Error("Invalid recurrence type");
		}
	}, [
		recurrenceType,
		startDate,
		endDate,
		maxOccurrences,
		frequencyPreset,
		customFrequency,
		useCustomFrequency,
	]);

	const previewText = useMemo(() => {
		try {
			const pattern = createPattern();
			const freq = pattern.frequency;

			switch (pattern.type) {
				case RecurrenceType.ONE_TIME:
					return `One-time on ${startDate.format("MMM D, YYYY")}`;

				case RecurrenceType.INFINITE:
					return `Every ${freq?.value} starting ${startDate.format(
						"MMM D, YYYY"
					)}`;

				case RecurrenceType.UNTIL_DATE:
					return `Every ${freq?.value} from ${startDate.format(
						"MMM D, YYYY"
					)} until ${endDate?.format("MMM D, YYYY")}`;

				case RecurrenceType.N_OCCURRENCES:
					return `Every ${freq?.value} starting ${startDate.format(
						"MMM D, YYYY"
					)}, ${maxOccurrences} times`;

				default:
					return "Invalid pattern";
			}
		} catch (error) {
			console.error("Failed to create pattern preview:", error);
			return "Invalid pattern configuration";
		}
	}, [
		recurrenceType,
		startDate,
		endDate,
		maxOccurrences,
		frequencyPreset,
		customFrequency,
		useCustomFrequency,
	]);

	// Effect to validate and emit changes
	useEffect(() => {
		let effectiveFrequency: string | undefined;
		if (recurrenceType === RecurrenceType.ONE_TIME) {
			effectiveFrequency = undefined;
		} else if (useCustomFrequency) {
			effectiveFrequency = customFrequency;
		} else {
			effectiveFrequency = frequencyPreset;
		}

		const validationErrors = validatePattern(
			recurrenceType,
			startDate,
			effectiveFrequency,
			endDate,
			maxOccurrences
		);

		setErrors(validationErrors);
		onValidationChange?.(validationErrors.length === 0, validationErrors);

		if (validationErrors.length === 0) {
			try {
				const pattern = createPattern();
				onChange(pattern);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Failed to create pattern";
				console.error("Failed to create pattern:", error);
				const updatedErrors = [errorMessage];
				setErrors(updatedErrors);
				onValidationChange?.(false, updatedErrors);
			}
		}
	}, [
		recurrenceType,
		startDate,
		endDate,
		maxOccurrences,
		frequencyPreset,
		customFrequency,
		useCustomFrequency,
	]);

	const handleFrequencyPresetChange = (preset: string) => {
		setFrequencyPreset(preset);
		setUseCustomFrequency(false);
	};

	const handleCustomFrequencyToggle = () => {
		setUseCustomFrequency(!useCustomFrequency);
		if (!useCustomFrequency) {
			setCustomFrequency(frequencyPreset);
		}
	};

	return (
		<Card>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Recurrence Pattern
				</Typography>

				{/* Recurrence Type Selection */}
				<FormControl component="fieldset" margin="normal" fullWidth>
					<FormLabel component="legend">Recurrence Type</FormLabel>
					<RadioGroup
						value={recurrenceType}
						onChange={(e) =>
							setRecurrenceType(e.target.value as RecurrenceType)
						}
						row
					>
						<FormControlLabel
							value={RecurrenceType.ONE_TIME}
							control={<Radio />}
							label="One-time"
						/>
						<FormControlLabel
							value={RecurrenceType.INFINITE}
							control={<Radio />}
							label="Recurring"
						/>
						<FormControlLabel
							value={RecurrenceType.UNTIL_DATE}
							control={<Radio />}
							label="Until date"
						/>
						<FormControlLabel
							value={RecurrenceType.N_OCCURRENCES}
							control={<Radio />}
							label="Limited occurrences"
						/>
					</RadioGroup>
				</FormControl>

				{/* Start Date */}
				<Box margin="normal">
					<DatePicker
						label="Start Date"
						value={startDate}
						onChange={(newValue) =>
							newValue && setStartDate(newValue)
						}
						sx={{ width: "100%" }}
					/>
				</Box>

				{/* Frequency Selection (for recurring types) */}
				{recurrenceType !== RecurrenceType.ONE_TIME && (
					<Box margin="normal">
						<Typography variant="subtitle2" gutterBottom>
							Frequency
						</Typography>

						{!useCustomFrequency ? (
							<>
								<Stack
									direction="row"
									spacing={1}
									flexWrap="wrap"
								>
									{FREQUENCY_PRESETS.map((preset) => (
										<Chip
											key={preset.value}
											label={preset.label}
											variant={
												frequencyPreset === preset.value
													? "filled"
													: "outlined"
											}
											color={
												frequencyPreset === preset.value
													? "primary"
													: "default"
											}
											onClick={() =>
												handleFrequencyPresetChange(
													preset.value
												)
											}
											clickable
										/>
									))}
								</Stack>
								<Box mt={2}>
									<Chip
										label="Custom frequency"
										variant="outlined"
										onClick={handleCustomFrequencyToggle}
										clickable
									/>
								</Box>
							</>
						) : (
							<Box>
								<TextField
									fullWidth
									label="Custom Frequency"
									value={customFrequency}
									onChange={(e) =>
										setCustomFrequency(e.target.value)
									}
									placeholder="e.g., 2w3d (every 2 weeks and 3 days)"
									helperText="Format: [number][unit] where unit can be d (days), w (weeks), mo (months), y (years)"
								/>
								<Box mt={1}>
									<Chip
										label="Use presets"
										variant="outlined"
										onClick={handleCustomFrequencyToggle}
										clickable
									/>
								</Box>
							</Box>
						)}
					</Box>
				)}

				{/* End Date (for until date type) */}
				{recurrenceType === RecurrenceType.UNTIL_DATE && (
					<Box margin="normal">
						<DatePicker
							label="End Date"
							value={endDate}
							onChange={(newValue) => setEndDate(newValue)}
							minDate={startDate}
							sx={{ width: "100%" }}
						/>
					</Box>
				)}

				{/* Max Occurrences (for limited occurrences type) */}
				{recurrenceType === RecurrenceType.N_OCCURRENCES && (
					<Box margin="normal">
						<TextField
							fullWidth
							label="Number of Occurrences"
							type="number"
							value={maxOccurrences}
							onChange={(e) =>
								setMaxOccurrences(
									Number.parseInt(e.target.value, 10)
								)
							}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										times
									</InputAdornment>
								),
							}}
							inputProps={{ min: 1 }}
						/>
					</Box>
				)}

				<Divider sx={{ my: 2 }} />

				{/* Preview */}
				<Paper elevation={1} sx={{ p: 2, bgcolor: "grey.50" }}>
					<Typography
						variant="subtitle2"
						color="text.secondary"
						gutterBottom
					>
						Preview
					</Typography>
					<Typography variant="body2">{previewText}</Typography>
				</Paper>

				{/* Validation Errors */}
				{errors.length > 0 && (
					<Box mt={2}>
						{errors.map((error, index) => (
							<Alert
								severity="error"
								key={`${error}-${index}`}
								sx={{ mb: 1 }}
							>
								{error}
							</Alert>
						))}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};
