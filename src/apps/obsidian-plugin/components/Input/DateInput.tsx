export const DateInput = ({
	label,
	value,
	onChange,
	disabled,
	withTime,
	error,
}: {
	label?: string;
	value?: Date;
	onChange: (value: Date) => void;
	disabled?: boolean;
	withTime?: boolean;
	error?: string;
}) => {
	const formatDateForInput = (date?: Date): string => {
		if (!date) return "";
		const d = new Date(date);
		if (withTime) {
			// Format: YYYY-MM-DDTHH:mm
			const year = d.getFullYear();
			const month = String(d.getMonth() + 1).padStart(2, "0");
			const day = String(d.getDate()).padStart(2, "0");
			const hours = String(d.getHours()).padStart(2, "0");
			const minutes = String(d.getMinutes()).padStart(2, "0");
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		}
		// Format: YYYY-MM-DD
		return d.toISOString().split("T")[0];
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (value) {
			onChange(new Date(value));
		}
	};

	return (
		<div className="date-input-wrapper">
			{label && (
				<label
					className="date-input-label"
					style={{
						display: "block",
						marginBottom: "4px",
						fontSize: "0.875rem",
						fontWeight: 500,
						color: "var(--text-normal)",
					}}
				>
					{label}
				</label>
			)}
			<input
				type={withTime ? "datetime-local" : "date"}
				className="date-time-picker"
				value={formatDateForInput(value)}
				onChange={handleChange}
				disabled={disabled}
				style={{
					width: "100%",
					padding: "8px 12px",
					backgroundColor: "var(--background-modifier-form-field)",
					color: "var(--text-normal)",
					border: error
						? "1px solid var(--background-modifier-error)"
						: "1px solid var(--background-modifier-border)",
					borderRadius: "4px",
					fontSize: "0.875rem",
				}}
			/>
			{error && (
				<div
					className="date-input-error"
					style={{
						marginTop: "4px",
						fontSize: "0.75rem",
						color: "var(--text-error)",
					}}
				>
					{error}
				</div>
			)}
		</div>
	);
};
