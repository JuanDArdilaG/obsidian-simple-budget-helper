import { JSX } from "react";
import { LockField } from "./LockField";

export const WithLockField = ({
	children,
	style,
	isLocked,
	setIsLocked,
}: {
	children: JSX.Element;
	style?: React.CSSProperties;
	isLocked?: boolean;
	setIsLocked?: (value: boolean) => void;
}) => {
	if (!setIsLocked || isLocked === undefined) return children;
	return (
		<div style={{ ...style, display: "flex", alignItems: "center" }}>
			<div style={{ width: "90%" }}>{children}</div>
			<LockField
				setIsLocked={setIsLocked}
				isLocked={isLocked}
				style={{ width: "10%" }}
			/>
		</div>
	);
};
