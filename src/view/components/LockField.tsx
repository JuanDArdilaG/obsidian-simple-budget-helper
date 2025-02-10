import { Lock, LockOpen } from "lucide-react";

export const LockField = ({
	setIsLocked,
	isLocked,
}: {
	setIsLocked?: (value: boolean) => void;
	isLocked: boolean;
}) => {
	return isLocked ? (
		<Lock
			color="red"
			size={16}
			onClick={() => {
				if (setIsLocked) setIsLocked(false);
			}}
		/>
	) : (
		<LockOpen
			color="green"
			size={16}
			onClick={() => {
				if (setIsLocked) setIsLocked(true);
			}}
		/>
	);
};
