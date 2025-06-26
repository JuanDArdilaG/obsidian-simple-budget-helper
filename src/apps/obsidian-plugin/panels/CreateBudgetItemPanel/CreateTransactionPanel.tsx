import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Item } from "contexts/Items/domain";
import { useContext, useEffect, useState } from "react";
import { CreateTransactionForm } from "./CreateTransactionForm";

export const CreateTransactionPanel = ({
	close,
	onCreate,
}: {
	close: () => void;
	onCreate: () => void;
}) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		useCases: { getAllRegularItems },
	} = useContext(ItemsContext);

	const [items, setItems] = useState<Item[]>([]);
	useEffect(() => {
		getAllRegularItems.execute().then(({ items }) => setItems(items));
	}, [getAllRegularItems]);

	useEffect(() => {
		logger.title("items for creation").obj({ items }).log();
	}, [items]);

	return (
		<CreateTransactionForm
			items={items}
			close={close}
			onCreate={onCreate}
		/>
	);
};
