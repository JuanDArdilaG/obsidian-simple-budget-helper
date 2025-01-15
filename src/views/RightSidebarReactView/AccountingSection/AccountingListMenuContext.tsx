import { useContextMenu } from "./useContextMenu";

export const ContextMenu = ({ menu }: { menu: React.ReactNode }) => {
	const { xPos, yPos, showMenu } = useContextMenu();

	return showMenu ? (
		<div
			className="menu-container"
			style={{
				position: "fixed",
				top: yPos,
				left: xPos,
			}}
		>
			{menu}
		</div>
	) : null;
};
