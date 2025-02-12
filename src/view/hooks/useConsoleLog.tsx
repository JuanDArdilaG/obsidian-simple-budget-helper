import { useEffect } from "react";

export const useConsoleLog = ({
	title,
	data,
}: {
	title: string;
	data: any;
}) => {
	useEffect(() => {
		console.log({ title, data });
	}, [title, data]);
};
