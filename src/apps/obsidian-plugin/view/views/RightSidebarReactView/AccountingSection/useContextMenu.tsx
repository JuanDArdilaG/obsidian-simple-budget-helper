import { useState, useCallback, useEffect } from "react";

export type useContextMenuProps = {
	lock?: boolean;
	invalidClickChecker?: (e: MouseEvent) => boolean;
};

export const useContextMenu = ({
	lock,
	invalidClickChecker,
}: useContextMenuProps) => {
	const [xPos, setXPos] = useState("0px");
	const [yPos, setYPos] = useState("0px");
	const [showMenu, setShowMenu] = useState(false);

	const handleContextMenu = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();

			if (
				(e.target as HTMLElement)?.localName !== "li" &&
				(e.target as HTMLElement)?.parentElement?.localName !== "li" &&
				(e.target as HTMLElement)?.parentElement?.parentElement
					?.localName !== "li"
			)
				return;

			setXPos(`${e.layerX}px`);
			setYPos(`${e.layerY}px`);
			setShowMenu(true);
		},
		[setXPos, setYPos]
	);

	const handleClick = useCallback(
		(e: MouseEvent) => {
			if (invalidClickChecker && invalidClickChecker(e)) return;
			if (showMenu && !lock) setShowMenu(false);
		},
		[showMenu]
	);

	useEffect(() => {
		document.addEventListener("click", handleClick);
		document.addEventListener("contextmenu", handleContextMenu);
		return () => {
			document.addEventListener("click", handleClick);
			document.removeEventListener("contextmenu", handleContextMenu);
		};
	});

	return { xPos, yPos, showMenu };
};
