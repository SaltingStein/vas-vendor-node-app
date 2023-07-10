import { PaidOfferingHandler } from "./core";
export * from "./core";

export const findOfferingHandler = async (name: string) => {
	const path = `@modules/offerings/handlers/${name}`;
	try {
		let Offering;
		try {
			Offering = await import(path);
		} catch (error) {
			throw error;
			// throw new Error(`Offering ${path} could not be located`);
		}
		const Handler = Offering.default;
		return Handler as typeof PaidOfferingHandler;
		// if (type === "paid" && Handler.prototype instanceof PaidOfferingHandler) {
		// } else if (type === "any" && Handler.prototype instanceof BaseOfferingHandler) {
		// 	return Handler as typeof BaseOfferingHandler;
		// }
		// throw new Error(`Default Export for Offering ${path} does not inherit from ${type === "paid" ? "Paid" : "Base"}OfferingHandler`);
	} catch (error) {
		throw error;
	}
};
