import { Clear as ClearIcon, Search as SearchIcon } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useCallback, useState } from "react";

interface SearchInputProps {
	placeholder?: string;
	value?: string;
	onSearch: (searchTerm: string) => void;
	debounceMs?: number;
	style?: React.CSSProperties;
	"data-testid"?: string;
}

export const SearchInput = ({
	placeholder = "Search...",
	value: externalValue,
	onSearch,
	debounceMs = 300,
	style,
	"data-testid": dataTestId,
}: SearchInputProps) => {
	const [internalValue, setInternalValue] = useState(externalValue || "");
	const [debounceTimeout, setDebounceTimeout] =
		useState<NodeJS.Timeout | null>(null);

	// Use external value if provided, otherwise use internal state
	const displayValue =
		externalValue !== undefined ? externalValue : internalValue;

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = event.target.value;
			setInternalValue(newValue);

			// Clear existing timeout
			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}

			// Set new timeout for debounced search
			const timeout = setTimeout(() => {
				onSearch(newValue);
			}, debounceMs);

			setDebounceTimeout(timeout);
		},
		[debounceTimeout, debounceMs, onSearch]
	);

	const handleClear = useCallback(() => {
		setInternalValue("");
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}
		onSearch("");
	}, [debounceTimeout, onSearch]);

	return (
		<TextField
			data-testid={dataTestId}
			placeholder={placeholder}
			value={displayValue}
			onChange={handleInputChange}
			variant="outlined"
			size="small"
			fullWidth
			style={style}
			slotProps={{
				input: {
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon
								style={{
									color: "var(--text-muted)",
									fontSize: "20px",
								}}
							/>
						</InputAdornment>
					),
					endAdornment: displayValue ? (
						<InputAdornment position="end">
							<IconButton
								onClick={handleClear}
								size="small"
								style={{
									color: "var(--text-muted)",
								}}
							>
								<ClearIcon fontSize="small" />
							</IconButton>
						</InputAdornment>
					) : undefined,
					style: {
						backgroundColor: "var(--background-primary)",
						color: "var(--text-normal)",
						borderColor: "var(--background-modifier-border)",
					},
				},
				inputLabel: {
					style: {
						color: "var(--text-normal)",
					},
				},
			}}
			sx={{
				"& .MuiOutlinedInput-root": {
					"& fieldset": {
						borderColor: "var(--background-modifier-border)",
					},
					"&:hover fieldset": {
						borderColor: "var(--background-modifier-border-hover)",
					},
					"&.Mui-focused fieldset": {
						borderColor: "var(--interactive-accent)",
					},
				},
				"& .MuiInputBase-input": {
					color: "var(--text-normal)",
					"&::placeholder": {
						color: "var(--text-muted)",
						opacity: 1,
					},
				},
			}}
		/>
	);
};
