export const ConfirmDeleteModal = ({
	open,
	onConfirm,
	onCancel,
	count,
}: {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	count: number;
}) => {
	if (!open) return null;
	return (
		<div
			className="modal-backdrop"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				background: "rgba(0,0,0,0.3)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<div
				className="modal-content"
				style={{
					background: "var(--color-background-secondary, #222)",
					color: "var(--color-text, #fff)",
					padding: 24,
					borderRadius: 8,
					minWidth: 300,
					boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
				}}
			>
				<h3 style={{ margin: 0, marginBottom: 12 }}>
					Delete {count} item{count !== 1 ? "s" : ""}?
				</h3>
				<p style={{ margin: 0, marginBottom: 20 }}>
					Are you sure you want to delete the selected item
					{count !== 1 ? "s" : ""}? This action cannot be undone.
				</p>
				<div
					style={{
						display: "flex",
						gap: 12,
						justifyContent: "flex-end",
					}}
				>
					<button
						onClick={onCancel}
						style={{
							padding: "6px 16px",
							borderRadius: 4,
							border: "none",
							background: "var(--color-gray-light, #888)",
							color: "#fff",
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						style={{
							padding: "6px 16px",
							borderRadius: 4,
							border: "none",
							background: "var(--color-red, #d32f2f)",
							color: "#fff",
							cursor: "pointer",
						}}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};
