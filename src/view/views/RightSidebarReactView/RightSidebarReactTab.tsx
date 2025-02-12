export const RightSidebarReactTab = ({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle?: boolean;
	children: React.ReactNode;
}) => {
	return (
		<div style={{ padding: "8px" }}>
			{!subtitle ? <h2>{title}</h2> : <h3>{title}</h3>}
			{children}
		</div>
	);
};
