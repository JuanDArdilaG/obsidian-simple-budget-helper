import { Button as MuiButton } from "@mui/material";

export const Button = ({
	label,
	icon,
	onClick,
	disabled,
	style,
}: {
	label: string;
	icon?: React.ReactNode;
	onClick: (() => Promise<void>) | (() => void);
	disabled?: boolean;
	style?: React.CSSProperties;
}) => {
	const isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);

	const handleClick = () => {
		const result = onClick();
		if (result instanceof Promise) {
			result.catch((error) => {
				console.error("Button onClick error:", error);
			});
		}
	};

	return (
		<MuiButton
			disabled={disabled}
			variant="contained"
			startIcon={icon}
			onClick={handleClick}
			style={{
				color: "var(--text-normal)",
				padding: isMobile ? "12px 16px" : "20px",
				minHeight: isMobile ? "44px" : "auto",
				fontSize: isMobile ? "14px" : "inherit",
				backgroundColor: "var(--interactive-normal)",
				borderRadius: "8px",
				textTransform: "none",
				...style,
			}}
		>
			{label}
		</MuiButton>
	);
};
