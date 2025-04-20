import { useContext, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import {
	ItemDate,
	ItemRecurrence,
	ItemRecurrenceUntilDate,
} from "contexts/Items/domain";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateItemForm } from "./CreateItemForm";
import { Input } from "apps/obsidian-plugin/components/Input/Input";
import { DateInput } from "apps/obsidian-plugin/components/Input/DateInput";

export const CreateItemPanel = ({ close }: { close: () => void }) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		scheduledItems,
		updateItems,
		useCases: { createItem },
	} = useContext(ItemsContext);

	const [frequency, setFrequency] = useState("");

	const [withUntilDate, setWithUntilDate] = useState(false);
	const [untilDate, setUntilDate] = useState<Date>();
	const [recurrences, setRecurrences] = useState(0);

	return (
		<CreateItemForm
			close={close}
			items={scheduledItems}
			onSubmit={async (item, date) => {
				const itemDate =
					(date && new ItemDate(date?.value)) ||
					ItemDate.createNowDate();
				item.updateRecurrence(
					frequency
						? ItemRecurrence.fromPrimitives(item.id, {
								frequency,
								startDate: itemDate,
						  })
						: undefined
				);
				if (withUntilDate) {
					item.recurrence?.updateUntilDate(
						untilDate
							? new ItemRecurrenceUntilDate(untilDate)
							: undefined
					);
				} else if (recurrences > 0) {
					if (recurrences > 1)
						throw new Error(
							"TODO: calculate recurrences from untilDate"
						);
				}
				logger
					.debugB("creating scheduled item", {
						date,
						recurrences,
						item,
						frequency,
						withUntilDate,
					})
					.log();
				await createItem.execute(item);
				updateItems();
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between" }}>
				<Input<string>
					id="frequency"
					label="Frequency"
					value={frequency}
					onChange={setFrequency}
					// isLocked={locks.frequency}
					// setIsLocked={(value) => updateLock("frequency", value)}
					// error={validation.check("frequency") ?? undefined}
				/>
				{withUntilDate ? (
					<DateInput value={untilDate} onChange={setUntilDate} />
				) : (
					<Input
						id="recurrences"
						label="Recurrences"
						value={recurrences}
						onChange={(r) => setRecurrences(Number(r))}
						// error={
						// 	!validation || validation.untilDate
						// 		? undefined
						// 		: "required"
						// }
					/>
				)}
			</div>
			<FormControlLabel
				control={
					<Checkbox
						checked={withUntilDate}
						onChange={(e) => {
							const checked = e.target.checked;
							setUntilDate(checked ? new Date() : undefined);
							setWithUntilDate(checked);
						}}
					/>
				}
				label="With Until Date"
			/>
		</CreateItemForm>
	);
};
