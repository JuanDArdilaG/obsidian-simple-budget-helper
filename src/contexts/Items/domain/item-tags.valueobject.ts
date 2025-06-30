import { InvalidArgumentError } from "@juandardilag/value-objects";
import { ItemTag } from "./item-tag.valueobject";

export class ItemTags {
	constructor(private readonly _value: ItemTag[]) {
		this.validate();
	}

	get value(): ItemTag[] {
		return this._value;
	}

	validate(): void {
		// Check for duplicate tags (case-insensitive)
		const tagValues = this._value.map((tag) => tag.value.toLowerCase());
		const uniqueTagValues = new Set(tagValues);
		if (tagValues.length !== uniqueTagValues.size) {
			throw new InvalidArgumentError("tags", this._value);
		}
	}

	toString(): string {
		return this._value.map((tag) => tag.value).join(", ");
	}

	/**
	 * Add a new tag to the collection
	 */
	add(tag: ItemTag): ItemTags {
		const newTags = [...this._value, tag];
		return new ItemTags(newTags);
	}

	/**
	 * Remove a tag from the collection
	 */
	remove(tagToRemove: ItemTag): ItemTags {
		const newTags = this._value.filter(
			(tag) => tag.value.toLowerCase() !== tagToRemove.value.toLowerCase()
		);
		return new ItemTags(newTags);
	}

	/**
	 * Check if a tag exists in the collection
	 */
	has(tagToCheck: ItemTag): boolean {
		return this._value.some(
			(tag) => tag.value.toLowerCase() === tagToCheck.value.toLowerCase()
		);
	}

	/**
	 * Get the number of tags
	 */
	get count(): number {
		return this._value.length;
	}

	/**
	 * Check if the collection is empty
	 */
	get isEmpty(): boolean {
		return this._value.length === 0;
	}

	/**
	 * Get tags as string array
	 */
	toArray(): string[] {
		return this._value.map((tag) => tag.value);
	}

	/**
	 * Create empty tags collection
	 */
	static empty(): ItemTags {
		return new ItemTags([]);
	}

	/**
	 * Create tags from string array
	 */
	static fromStrings(tagStrings: string[]): ItemTags {
		const tags = tagStrings.map((tagString) => new ItemTag(tagString));
		return new ItemTags(tags);
	}

	/**
	 * Create tags from primitives
	 */
	static fromPrimitives(tagStrings: string[]): ItemTags {
		if (!tagStrings || tagStrings.length === 0) {
			return ItemTags.empty();
		}
		return ItemTags.fromStrings(tagStrings);
	}

	/**
	 * Convert to primitives
	 */
	toPrimitives(): string[] {
		return this.toArray();
	}
}
