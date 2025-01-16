import { useState, useCallback, useEffect } from "react";

export const useContextMenu = () => {
	const [xPos, setXPos] = useState("0px");
	const [yPos, setYPos] = useState("0px");
	const [showMenu, setShowMenu] = useState(false);

	const handleContextMenu = useCallback(
		(e: MouseEvent) => {
			e.preventDefault();

			if (
				e.target?.localName !== "li" &&
				e.target?.parentElement?.localName !== "li" &&
				e.target?.parentElement?.parentElement?.localName !== "li"
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
			if (showMenu) setShowMenu(false);
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
