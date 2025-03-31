import { useContext, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import {
	ScheduledItem,
	ScheduledItemNextDate,
	ScheduledItemRecurrence,
} from "contexts/ScheduledItems/domain";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateItemForm } from "./CreateItemForm";
import { Input } from "apps/obsidian-plugin/components/Input/Input";

export const CreateScheduledItemPanel = ({ close }: { close: () => void }) => {
	const { logger } = useLogger("CreateScheduledItemPanel");
	const {
		scheduledItems,
		updateScheduledItems,
		useCases: { createScheduledItem },
	} = useContext(ItemsContext);

	const [frequency, setFrequency] = useState("");

	const [withUntilDate, setWithUntilDate] = useState(false);
	const [date, setDate] = useState<Date>(new Date());
	const [untilDate, setUntilDate] = useState<Date>();
	const [recurrences, setRecurrences] = useState(0);

	return (
		<CreateItemForm
			close={close}
			items={scheduledItems}
			onSubmit={async (item) => {
				const itemDate = new ScheduledItemNextDate(date);
				const scheduledItem = ScheduledItem.fromSimpleItem(
					item,
					itemDate,
					frequency
						? ScheduledItemRecurrence.fromPrimitives(item.id, {
								frequency,
								startDate: date,
						  })
						: undefined
				);
				if (withUntilDate) {
					scheduledItem.recurrence?.updateUntilDate(
						untilDate
							? new ScheduledItemNextDate(untilDate)
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
				await createScheduledItem.execute(scheduledItem);
				updateScheduledItems();
			}}
		>
			<Input<Date>
				dateWithTime
				id="date"
				label="Date"
				value={date}
				onChange={setDate}
				// isLocked={locks.date}
				// setIsLocked={(value) => updateLock("date", value)}
				// error={validation.check("nextDate") ?? undefined}
			/>
			<Input<string>
				id="frequency"
				label="Frequency"
				value={frequency}
				onChange={setFrequency}
				// isLocked={locks.frequency}
				// setIsLocked={(value) => updateLock("frequency", value)}
				// error={validation.check("frequency") ?? undefined}
			/>
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
			{withUntilDate ? (
				<Input<Date>
					dateWithTime
					id="untilDate"
					label="Until Date"
					value={untilDate}
					onChange={setUntilDate}
					// error={
					// 	!validation || validation.untilDate
					// 		? undefined
					// 		: "required"
					// }
				/>
			) : undefined}
			{!withUntilDate ? (
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
			) : undefined}
		</CreateItemForm>
	);
};
