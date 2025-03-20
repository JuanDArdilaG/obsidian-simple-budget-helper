import { useEffect, useState } from "react";

export const useAsyncCallback = <T>(t: any, callback: () => Promise<any>) => {
	const [res, setRes] = useState<T>();
	useEffect(() => {
		(callback.bind(t) as () => Promise<any>)().then((res) => setRes(res));
	}, [callback]);

	return res;
};
