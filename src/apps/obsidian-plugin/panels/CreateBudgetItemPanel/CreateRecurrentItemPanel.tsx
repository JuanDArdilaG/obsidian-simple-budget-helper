import { useContext, useState } from "react";
import { Checkbox, FormControlLabel } from "@mui/material";
import {
	RecurrentItem,
	RecurrrentItemFrequency,
	RecurrentItemNextDate,
} from "contexts/Items/domain";
import { Input } from "apps/obsidian-plugin/components/Input";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateItemForm } from "./CreateItemForm";

export const CreateRecurrentItemPanel = ({ close }: { close: () => void }) => {
	const logger = useLogger("CreateRecurrentItemPanel");
	const {
		recurrentItems,
		updateRecurrentItems,
		useCases: { createItem },
	} = useContext(ItemsContext);

	const [frequency, setFrequency] = useState<string>();

	const [withUntilDate, setWithUntilDate] = useState(false);
	const [untilDate, setUntilDate] = useState<Date>();
	const [recurrences, setRecurrences] = useState(0);

	return (
		<CreateItemForm
			close={close}
			items={recurrentItems}
			onSubmit={async (item, date) => {
				const nextDate = new RecurrentItemNextDate(date.valueOf());
				const recurrentItem = RecurrentItem.fromSimpleItem(
					item,
					nextDate,
					frequency
						? new RecurrrentItemFrequency(frequency)
						: undefined
				);
				if (withUntilDate) {
					recurrentItem.updateUntilDate(
						untilDate
							? new RecurrentItemNextDate(untilDate)
							: undefined
					);
				} else if (recurrences > 0) {
					if (recurrences === 1)
						recurrentItem.updateUntilDate(nextDate);
					// TODO: calculate recurrences from untilDate
				}
				logger
					.debugB("creating recurrent item", {
						nextDate,
						recurrences,
						item,
						frequency,
						withUntilDate,
					})
					.log();
				await createItem.execute(recurrentItem);
				updateRecurrentItems();
			}}
		>
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
