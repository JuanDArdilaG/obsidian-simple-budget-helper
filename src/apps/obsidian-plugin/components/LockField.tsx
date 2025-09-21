import { Lock, LockOpen } from "lucide-react";

export const LockField = ({
	setIsLocked,
	isLocked,
	style,
}: {
	setIsLocked?: (value: boolean) => void;
	style?: React.CSSProperties;
	isLocked?: boolean;
}) => {
	return isLocked ? (
		<Lock
			style={style}
			color="red"
			size={16}
			onClick={() => {
				if (setIsLocked) setIsLocked(false);
			}}
		/>
	) : (
		<LockOpen
			style={style}
			color="green"
			size={16}
			onClick={() => {
				if (setIsLocked) setIsLocked(true);
			}}
		/>
	);
};
