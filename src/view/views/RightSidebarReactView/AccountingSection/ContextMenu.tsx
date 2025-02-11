import { useEffect } from "react";
import { useContextMenu, useContextMenuProps } from "./useContextMenu";

export const ContextMenu = ({
	menu,
	hookProps,
	setShowMenu,
}: {
	menu: React.ReactNode;
	hookProps?: useContextMenuProps;
	setShowMenu?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const { xPos, yPos, showMenu } = useContextMenu(hookProps ?? {});
	useEffect(() => {
		if (setShowMenu) setShowMenu(showMenu);
	}, [showMenu, setShowMenu]);

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
