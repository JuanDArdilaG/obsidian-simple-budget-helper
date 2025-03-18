import { IEntity } from "contexts/Shared/domain/entity.interface";
import { SubcategoryID } from "./subcategory-id.valueobject";
import { SubcategoryName } from "./subcategory-name.valueobject";

export class Subcategory
	implements IEntity<SubcategoryID, SubcategoryPrimitives>
{
	constructor(private _id: SubcategoryID, private _name: SubcategoryName) {}

	get id(): SubcategoryID {
		return this._id;
	}

	toPrimitives(): SubcategoryPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
		};
	}
}

export type SubcategoryPrimitives = {
	id: string;
	name: string;
};
