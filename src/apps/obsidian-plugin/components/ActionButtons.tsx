import { LucideMinus, LucidePlus, RefreshCcw } from "lucide-react";

export const ActionButtons = ({
	handleCreateClick,
	isCreating,
}: {
	handleCreateClick: () => Promise<void>;
	isCreating: boolean;
}) => {
	return (
		<div>
			<button style={{ float: "left" }} onClick={async () => {}}>
				<RefreshCcw size={16} />
			</button>
			<button
				style={{ float: "right" }}
				onClick={async () => {
					await handleCreateClick();
				}}
			>
				{isCreating ? (
					<LucideMinus size={16} />
				) : (
					<LucidePlus size={16} />
				)}
			</button>
		</div>
	);
};
