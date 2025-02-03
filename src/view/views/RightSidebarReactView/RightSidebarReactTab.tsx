export const RightSidebarReactTab = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	return (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	);
};
