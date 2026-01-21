import {
	FormControl,
	FormControlLabel,
	FormHelperText,
	FormLabel,
	Radio,
	RadioGroup,
} from "@mui/material";

export const RadioSelect = ({
	id,
	label,
	style,
	value,
	options,
	onChange,
	error,
	row = false,
}: {
	id: string;
	label?: string;
	style?: React.CSSProperties;
	value: string;
	options: { value: string; label: string }[];
	onChange: (value: string) => void;
	error?: string;
	row?: boolean;
}) => {
	return (
		<FormControl fullWidth error={!!error} style={style}>
			{label && (
				<FormLabel
					id={`${id}-label`}
					style={{
						color: error
							? "var(--text-error)"
							: "var(--text-muted)",
						paddingLeft: 0,
						padding: 5,
					}}
				>
					{label}
				</FormLabel>
			)}
			<RadioGroup
				aria-labelledby={label ? `${id}-label` : undefined}
				name={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				row={row}
			>
				{options.map(({ value, label }) => {
					return (
						<FormControlLabel
							key={value}
							value={value}
							control={
								<Radio
									style={{
										color: "var(--text-muted)",
									}}
									sx={{
										"&.Mui-checked": {
											color: "var(--interactive-accent)",
										},
									}}
								/>
							}
							label={label}
							style={{
								color: "var(--text-normal)",
							}}
						/>
					);
				})}
			</RadioGroup>
			{error && (
				<FormHelperText
					style={{ color: "var(--text-error)", marginLeft: 0 }}
				>
					{error}
				</FormHelperText>
			)}
		</FormControl>
	);
};
