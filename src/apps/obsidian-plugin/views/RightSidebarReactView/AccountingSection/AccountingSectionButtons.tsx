import { Menu } from "lucide-react";
import { SectionButton } from "../../../components/SectionButtons";

export type AccountingSectionSelection = "movements";

export const AccountingSectionButtons = ({
	selected,
	setSelected,
}: {
	selected: AccountingSectionSelection;
	setSelected: (selected: AccountingSectionSelection) => void;
}) => {
	return (
		<div className="section-buttons">
			<SectionButton
				type="movements"
				label="Movements"
				icon={<Menu size={16} />}
				selected={selected}
				onClick={() => setSelected("movements")}
			/>
		</div>
	);
};
