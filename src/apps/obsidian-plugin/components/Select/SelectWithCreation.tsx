import { SyntheticEvent } from "react";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { Autocomplete, Box, TextField, FormHelperText } from "@mui/material";
import { WithLockField } from "../WithLockField";

export const SelectWithCreation = <T extends object | string>({
	id,
	style,
	label,
	placeholder,
	item,
	items,
	getLabel,
	getKey,
	onChange,
	setSelectedItem,
	isLocked,
	setIsLocked,
	error,
}: {
	id: string;
	style?: React.CSSProperties;
	label?: string;
	placeholder?: string;
	item: T;
	items: T[];
	getLabel?: (_: T) => string;
	getKey?: (_: T) => string;
	onChange: (value: string) => void;
	setSelectedItem?: (value: T | undefined) => void;
	error?: string;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
}) => {
	const { logger } = useLogger("SelectWithCreation");
	if (typeof item !== "string" && (!getKey || !getLabel))
		throw new Error(
			"getKey and getLabel are required for items that are not strings. id: " +
				id
		);

	return (
		<WithLockField
			isLocked={isLocked}
			setIsLocked={setIsLocked}
			style={{ width: "100%", ...style }}
		>
			<Box>
				<Autocomplete
					freeSolo
					value={getKey ? getKey(item) : String(item)}
					disabled={isLocked}
					isOptionEqualToValue={(option, value) =>
						(getKey && typeof option !== "string"
							? getKey(option)
							: option) ===
						(getKey && typeof value !== "string"
							? getKey(value)
							: value)
					}
					options={items.map((item) =>
						getLabel ? getLabel(item) : String(item)
					)}
					getOptionKey={getKey ?? String}
					getOptionLabel={(item) =>
						typeof item !== "string" && getKey
							? getKey(item)
							: String(item)
					}
					renderOption={(props, item) => {
						const { key, ...optionProps } = props;
						return (
							<Box key={key} component="li" {...optionProps}>
								{typeof item === "string"
									? item
									: getLabel?.(item)}
							</Box>
						);
					}}
					onChange={(
						_: SyntheticEvent,
						newValue: T | string | null
					) => {
						if (newValue) {
							const item = items.find(
								(item) =>
									(getLabel
										? getLabel(item)
										: String(item)) ===
									(typeof newValue === "string"
										? newValue
										: getLabel
										? getLabel(newValue)
										: String(newValue))
							);
							logger.debug("onChange", {
								newValue,
								item,
								val:
									typeof newValue === "string"
										? newValue
										: getLabel
										? getLabel(newValue)
										: String(newValue),
							});
							setSelectedItem?.(item);
						}
					}}
					onInputChange={(_, value) => onChange(value)}
					renderInput={(params) => (
						<TextField
							{...params}
							label={label}
							placeholder={placeholder}
							variant="standard"
							disabled={isLocked}
							error={!!error}
							slotProps={{
								inputLabel: {
									style: {
										color: error
											? "var(--text-error)"
											: "var(--text-muted)",
										paddingLeft: 12,
										paddingTop: 5,
										zIndex: 1,
									},
								},
								input: {
									...params.InputProps,
									style: {
										color: "var(--text-normal)",
										backgroundColor:
											"var(--background-modifier-form-field)",
									},
								},
								htmlInput: {
									...params.inputProps,
									style: {
										width: "100%",
										border: "none",
										paddingLeft: 12,
									},
								},
							}}
						/>
					)}
				/>
				{error && (
					<FormHelperText
						style={{ color: "var(--text-error)", marginLeft: 0 }}
					>
						{error}
					</FormHelperText>
				)}
			</Box>
		</WithLockField>
	);
};
