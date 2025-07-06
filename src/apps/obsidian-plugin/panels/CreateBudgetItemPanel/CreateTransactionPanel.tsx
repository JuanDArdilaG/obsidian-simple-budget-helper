import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { Item } from "contexts/Items/domain";
import { Transaction } from "contexts/Transactions/domain";
import { useContext, useEffect, useState } from "react";
import { TransactionForm } from "./TransactionForm";

export const CreateTransactionPanel = ({
	close,
	onCreate,
	transaction,
}: {
	close: () => void;
	onCreate: () => void;
	transaction?: Transaction | null;
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
		<TransactionForm
			items={items}
			close={close}
			onSubmit={onCreate}
			transaction={transaction || undefined}
		/>
	);
};
