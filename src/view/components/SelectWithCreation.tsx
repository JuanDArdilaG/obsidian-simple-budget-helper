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
	setSelectedItem,
}: {
	id: string;
	style?: React.CSSProperties;
	label: string;
	item?: T;
	items: T[];
	getLabel?: (_: T) => string;
	onChange: (value: string) => void;
	setSelectedItem?: (value: T) => void;
}) => {
	if (typeof item !== "string" && !getLabel)
		throw new Error(
			"extractValue is required for items that are not strings. id: " + id
		);

	return (
		<Autocomplete
			freeSolo
			id={id}
			style={style}
			className="select-with-creation"
			options={items.map<SelectOptionType<T>>((item) => ({
				value: item,
			}))}
			renderInput={(params) => (
				<TextField {...params} placeholder={label} variant="standard" />
			)}
			selectOnFocus
			value={{ value: item } as SelectOptionType<T>}
			filterOptions={(options, params) => {
				const filtered = createFilter<T>()(options, params);

				const { inputValue } = params;
				// Suggest the creation of a new value
				const isExisting = options.some(
					(option) =>
						inputValue ===
						(!getLabel ? option.value : getLabel(option.value as T))
				);
				if (inputValue !== "" && !isExisting) {
					filtered.push({
						inputValue,
						value: `Add "${inputValue}"`,
					});
				}

				return filtered;
			}}
			getOptionLabel={(option) => {
				// Value selected with enter, right from the input
				if (typeof option === "string") {
					return option;
				}
				// Add "xxx" option created dynamically
				if (option.inputValue) {
					return option.inputValue;
				}
				// Regular option
				if (typeof option.value === "string") {
					if (!getLabel) return option.value;
					return getLabel(option.value as unknown as T);
				}
				return getLabel ? getLabel(option.value as T) : "";
			}}
			onBlur={(e) => {
				const value = (e.target as HTMLInputElement).value;
				console.log({
					title: "onBlur",
					id,
					value,
				});
				onChange((e.target as HTMLInputElement).value);
			}}
			onChange={(_, newValue) => {
				console.log({ title: "onChange", id, newValue });
				if (typeof newValue === "string") {
					onChange(newValue ?? "");
				} else if (typeof newValue?.value === "string") {
					onChange(newValue.value ?? "");
				} else if (newValue?.value) {
					if (getLabel) onChange(getLabel(newValue.value));
					if (setSelectedItem) setSelectedItem(newValue.value);
				}
			}}
		/>
		// <div className="horizontal-input">
		// 	<div
		// 		style={{
		// 			display: "flex",
		// 			justifyContent: "space-around",
		// 			gap: "5px",
		// 		}}
		// 	>
		// 		<div
		// 			style={{
		// 				display: "flex",
		// 				flexDirection: "column",
		// 				alignItems: "center",
		// 			}}
		// 		>
		// 			<label htmlFor={`${id}-input`}>{label}</label>
		// 			<select
		// 				value={value}
		// 				onChange={(e) => onChange(e.target.value)}
		// 			>
		// 				{[...new Set([...values, "-- create new --"])]
		// 					.sort()
		// 					.map((item, index) => (
		// 						<option value={item} key={index}>
		// 							{item}
		// 						</option>
		// 					))}
		// 			</select>
		// 		</div>
		// 		{value === "-- create new --" && (
		// 			<div
		// 				style={{
		// 					display: "flex",
		// 					flexDirection: "column",
		// 					alignItems: "center",
		// 				}}
		// 			>
		// 				<label
		// 					htmlFor={`create-${id}-input`}
		// 					style={error ? { color: "red" } : {}}
		// 				>
		// 					{`New: ${label}`}
		// 				</label>
		// 				<input
		// 					id={`create-${id}-input`}
		// 					type="text"
		// 					style={error ? { border: "1px solid red" } : {}}
		// 					onChange={(e) => onCreationChange(e.target.value)}
		// 				/>
		// 				{error && <div style={{ color: "red" }}>Required</div>}
		// 			</div>
		// 		)}
		// 	</div>
		// </div>
	);
};
