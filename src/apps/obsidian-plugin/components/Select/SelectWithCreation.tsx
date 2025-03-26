import { useEffect, useState } from "react";
import { Input, LockField } from "apps/obsidian-plugin/components";
import { useLogger } from "apps/obsidian-plugin/hooks";

export const SelectWithCreation = <T extends Object>({
	id,
	style,
	label,
	item,
	items,
	getLabel,
	getKey,
	onChange,
	setSelectedItem,
	error,
	isLocked,
	setIsLocked,
}: {
	id: string;
	style?: React.CSSProperties;
	label: string;
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
	const logger = useLogger("SelectWithCreation", false);
	if (typeof item !== "string" && !getKey)
		throw new Error(
			"getKey is required for items that are not strings. id: " + id
		);

	const [input, setInput] = useState(getKey ? getKey(item) : String(item));

	useEffect(() => {
		setInput(getKey ? getKey(item) : String(item));
	}, [item]);

	useEffect(() => {
		logger.title("input changed").attr("input", input).on().log();
		onChange(input);
	}, [input]);

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-around",
				...style,
			}}
		>
			<datalist id={"options-" + id}>
				{items.map((item) => (
					<option
						key={getKey ? getKey(item) : String(item)}
						value={getKey ? getKey(item) : String(item)}
					>
						{getLabel
							? getLabel(item)
							: getKey
							? getKey(item)
							: String(item)}
					</option>
				))}
			</datalist>
			<Input
				id={id}
				label={label}
				value={input}
				onChange={(value) => {
					const item = items.find(
						(item) =>
							(getKey ? getKey(item) : String(item)) === value
					);
					logger.off().debug("selection with creation on select", {
						value,
						item,
					});
					setSelectedItem?.(item);
					setInput(value);
				}}
				datalist={"options-" + id}
				style={{ width: "80%" }}
				error={error}
			/>
			{setIsLocked && (
				<LockField setIsLocked={setIsLocked} isLocked={isLocked} />
			)}
		</div>
	);
};
