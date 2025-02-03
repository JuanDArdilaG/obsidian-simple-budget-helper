import { SectionButton } from "../SectionButtons";

export type SectionSelection = "movements" | "accounts";

export const AccountingSectionButtons = ({
	selected,
	setSelected,
}: {
	selected: SectionSelection;
	setSelected: (selected: SectionSelection) => void;
}) => {
	return (
		<>
			<div className="section-buttons">
				<SectionButton
					type="movements"
					label="Movements"
					selected={selected}
					onClick={() => setSelected("movements")}
				/>
				<SectionButton
					type="accounts"
					label="Accounts"
					selected={selected}
					onClick={() => setSelected("accounts")}
				/>
			</div>
		</>
	);
};
