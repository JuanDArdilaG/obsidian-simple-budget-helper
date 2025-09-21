import { DateValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemName,
	ItemPrice,
	ItemType,
	ProductItem,
	ServiceItem,
} from "contexts/Items/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { describe, expect, it } from "vitest";

describe("Item Amount Field", () => {
	it("should create ProductItem with amount", () => {
		const name = new ItemName("Test Product");
		const category = CategoryID.generate();
		const subCategory = SubCategoryID.generate();
		const amount = new ItemPrice(150.5);
		const updatedAt = DateValueObject.createNowDate();

		const productItem = new ProductItem(
			ProductItem.create(name, category, subCategory, amount).id,
			name,
			category,
			subCategory,
			amount,
			updatedAt
		);

		expect(productItem.amount.value).toBe(150.5);
		expect(productItem.type).toBe(ItemType.PRODUCT);
	});

	it("should create ServiceItem with amount", () => {
		const name = new ItemName("Test Service");
		const category = CategoryID.generate();
		const subCategory = SubCategoryID.generate();
		const amount = new ItemPrice(75.25);
		const updatedAt = DateValueObject.createNowDate();

		const serviceItem = new ServiceItem(
			ServiceItem.create(name, category, subCategory, amount).id,
			name,
			category,
			subCategory,
			amount,
			updatedAt
		);

		expect(serviceItem.amount.value).toBe(75.25);
		expect(serviceItem.type).toBe(ItemType.SERVICE);
	});

	it("should update amount on ProductItem", () => {
		const productItem = ProductItem.create(
			new ItemName("Test Product"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(100)
		);

		const newAmount = new ItemPrice(200);
		productItem.updateAmount(newAmount);

		expect(productItem.amount.value).toBe(200);
	});

	it("should update amount on ServiceItem", () => {
		const serviceItem = ServiceItem.create(
			new ItemName("Test Service"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(50)
		);

		const newAmount = new ItemPrice(125);
		serviceItem.updateAmount(newAmount);

		expect(serviceItem.amount.value).toBe(125);
	});

	it("should serialize and deserialize ProductItem with amount", () => {
		const productItem = ProductItem.create(
			new ItemName("Test Product"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(300)
		);

		const primitives = productItem.toPrimitives();
		expect(primitives.amount).toBe(300);

		const deserializedItem = ProductItem.fromPrimitives(primitives);
		expect(deserializedItem.amount.value).toBe(300);
	});

	it("should serialize and deserialize ServiceItem with amount", () => {
		const serviceItem = ServiceItem.create(
			new ItemName("Test Service"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(250)
		);

		const primitives = serviceItem.toPrimitives();
		expect(primitives.amount).toBe(250);

		const deserializedItem = ServiceItem.fromPrimitives(primitives);
		expect(deserializedItem.amount.value).toBe(250);
	});

	it("should copy ProductItem with amount", () => {
		const productItem = ProductItem.create(
			new ItemName("Test Product"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(400)
		);

		const copiedItem = productItem.copy();
		expect(copiedItem.amount.value).toBe(400);
		expect(copiedItem.id.value).toBe(productItem.id.value);
	});

	it("should copy ServiceItem with amount", () => {
		const serviceItem = ServiceItem.create(
			new ItemName("Test Service"),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemPrice(175)
		);

		const copiedItem = serviceItem.copy();
		expect(copiedItem.amount.value).toBe(175);
		expect(copiedItem.id.value).toBe(serviceItem.id.value);
	});
});
