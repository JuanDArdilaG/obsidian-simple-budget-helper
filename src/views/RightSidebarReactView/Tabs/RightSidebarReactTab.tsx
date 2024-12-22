export const RightSidebarReactTab = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => {
	return (
		<div>
			<h1>{title}</h1>

			{children}
		</div>
	);
};
