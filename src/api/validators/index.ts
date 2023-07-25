import { sanitizePhoneNumber, verifyPhoneNumber } from "@libs/utils";
import { body, check, param, query } from "express-validator/check";
enum Sources {
	"AGENCY" = "agency",
}
export const SOURCES = ["agency"];
export const PRODUCTS = ["airtime", "electricity", "cableTv", "dataBundle"];
export const Params = (productNames = PRODUCTS) => [
	body("params")
		.exists()
		.custom((value: any) => {
			return typeof value === "object";
		}),
	body("params.productName")
		.exists()
		.withMessage("params.productName is required")
		.custom(async (value, {}) => {
			if (!productNames.includes(value)) {
				return Promise.reject(false);
			} else {
				return Promise.resolve(true);
			}
		})
		.withMessage(`Unknown product name`),
	body("params.productType").exists().withMessage("params.productType is required").toUpperCase(),
	body("params.productCode").optional(),
	body("params.providerId").exists().withMessage("params.providerId is required"),
	// body("params.amount").exists().withMessage("params.amount is required"),
	body("params.amount").optional().isNumeric(),
];

export const Offering = [body("offering").exists().withMessage("Offering is required").isString()];
export const Source = [body("source").exists().withMessage("Source is required").isString()];

export const VendSource = (source = SOURCES) => [
	body("source")
		.custom((value) => {
			if (!value) {
				return false;
			} else {
				return true;
			}
		})
		.withMessage("source is required"),
	body("source.sessionId")
		.custom((value) => {
			if (!value) {
				return false;
			} else {
				return true;
			}
		})
		.withMessage("source.sessionId is required"),
	body("source.sourceId")
		.custom((value) => {
			if (!value) {
				return false;
			} else {
				return true;
			}
		})
		.withMessage("source.sourceId is required")
		.custom((value: string) => {
			return verifyPhoneNumber(value);
		})
		.withMessage("source.sourceId is not a valid nigerian phone number")
		.customSanitizer((value: string) => {
			return sanitizePhoneNumber(value);
		}),
	body("source.source")
		.custom((value) => {
			if (!value) {
				return false;
			} else {
				return true;
			}
		})
		.withMessage("source.source is required")
		.customSanitizer((value: string) => {
			return value.toLowerCase();
		})
		.trim()
		.custom(async (value, { req, location, path }) => {
			if (!source.includes(value)) {
				return Promise.reject(false);
			}
			// if (value === Sources.AGENCY) {
			// 	const { user } = req;
			// 	// search merchant profile using source ID
			// }
			return Promise.resolve(true);
		})
		.withMessage(`Unknown source`),
];

export const List = {
	fetch: [param("name").exists(), query("*").optional()],
};

export const Vend = {
	service: [...Params(), ...VendSource()],
};

export const NONE = [check("*").optional()];
