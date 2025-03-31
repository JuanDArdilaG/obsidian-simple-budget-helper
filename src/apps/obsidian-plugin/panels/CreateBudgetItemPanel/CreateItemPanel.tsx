import { useContext, useEffect, useState } from "react";
import { Item } from "contexts/SimpleItems/domain";
import {
	AccountsContext,
	ItemsContext,
	TransactionsContext,
} from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useLogger } from "apps/obsidian-plugin/hooks/useLogger";
import { CreateItemForm } from "./CreateItemForm";

export const CreateItemPanel = ({ close }: { close: () => void }) => {
	const { logger } = useLogger("CreateItemPanel");
	const {
		useCases: { getAllUniqueItemsByName, recordSimpleItem },
	} = useContext(ItemsContext);

	const { updateTransactions } = useContext(TransactionsContext);

	const { updateAccounts } = useContext(AccountsContext);

	const [items, setItems] = useState<Item[]>([]);
	useEffect(() => {
		getAllUniqueItemsByName.execute().then((items) => setItems(items));
	}, [getAllUniqueItemsByName]);

	useEffect(() => {
		logger.title("unique items for creation").obj({ items }).log();
	}, [items]);

	return (
		<>
			<CreateItemForm
				items={items}
				onSubmit={async (item) => {
					await recordSimpleItem.execute({
						item,
					});
					updateAccounts();
					updateTransactions();
				}}
				close={close}
			/>
		</>
	);
};
