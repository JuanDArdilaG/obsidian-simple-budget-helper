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
	onClick: () => Promise<void>;
	disabled?: boolean;
	style?: React.CSSProperties;
}) => {
	return (
		<MuiButton
			disabled={disabled}
			variant="contained"
			startIcon={icon}
			onClick={onClick}
			style={{
				color: "var(--text-normal)",
				padding: 20,
				backgroundColor: "var(--interactive-normal)",
				...style,
			}}
		>
			{label}
		</MuiButton>
	);
};
