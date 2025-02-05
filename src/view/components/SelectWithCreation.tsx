import { Autocomplete, createFilterOptions, TextField } from "@mui/material";

interface SelectOptionType<T extends Object> {
	inputValue?: string;
	value: T | string;
}

const createFilter = <T extends Object>() =>
	createFilterOptions<SelectOptionType<T>>();

export const SelectWithCreation = <T extends Object>({
	id,
	style,
	label,
	item,
	items,
	getLabel,
	onChange,
	onCreationChange,
	setSelectedItem,
	error,
}: {
	id: string;
	style?: React.CSSProperties;
	label: string;
	item?: T;
	items: T[];
	getLabel?: (_: T) => string;
	onChange: (value: string) => void;
	onCreationChange: (value: string) => void;
	setSelectedItem?: (value: T) => void;
	error?: string;
}) => {
	if (typeof item !== "string" && !getLabel)
		throw new Error(
			"getLabel is required for items that are not strings. id: " + id
		);

	return (
		<div className="horizontal-input">
			<div
				style={{
					display: "flex",
					justifyContent: "space-around",
					gap: "5px",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
					}}
				>
					<label htmlFor={`${id}-input`} style={{ margin: "5px" }}>
						{label}
					</label>
					<select
						style={{ maxWidth: "100%" }}
						value={getLabel && item ? getLabel(item) : undefined}
						onChange={(e) => onChange(e.target.value)}
					>
						{[
							...new Set([
								...items.map((item) =>
									getLabel ? getLabel(item) : ""
								),
								"-- create new --",
							]),
						]
							.sort()
							.map((item, index) => (
								<option value={item} key={index}>
									{item}
								</option>
							))}
					</select>
				</div>
				{getLabel && item
					? getLabel(item) === "-- create new --" && (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
								}}
							>
								<label
									htmlFor={`create-${id}-input`}
									style={error ? { color: "red" } : {}}
								>
									{`New: ${label}`}
								</label>
								<input
									id={`create-${id}-input`}
									type="text"
									style={
										error ? { border: "1px solid red" } : {}
									}
									onChange={(e) =>
										onCreationChange(e.target.value)
									}
								/>
								{error && (
									<div style={{ color: "red" }}>Required</div>
								)}
							</div>
					  )
					: ""}
			</div>
		</div>
	);
};
