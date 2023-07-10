import { sanitizePhoneNumber, verifyPhoneNumber } from "@libs/utils";
import { body, check, param, query } from "express-validator/check";
enum Sources {
	"AGENCY" = "agency",
}
export const SOURCES = ["agency"];
export const PRODUCTS = ["airtime", "electricity", "cableTv", "databundle"];
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
		.withMessage(`Unknown source`),
	body("params.productType").exists().withMessage("params.productType is required"),
	body("params.productCode").optional(),
	body("params.providerId").exists().withMessage("params.productId is required"),
];

export const Offering = [body("offering").exists().withMessage("offering is required").isString()];

export const Source = (source = SOURCES) => [
	body("source").exists().withMessage("source is required"),
	body("source.sessionId").exists().withMessage("source.sessionId is required"),
	body("source.sourceId")
		.exists()
		.withMessage("source.sourceId is required")
		.custom((value: string) => {
			return verifyPhoneNumber(value);
		})
		.withMessage("source.sourceId is not a valid nigerian phone number")
		.customSanitizer((value: string) => {
			return sanitizePhoneNumber(value);
		}),
	body("source.source")
		.exists()
		.withMessage("user.source is required")
		.customSanitizer((value: string) => {
			return value.toLowerCase();
		})
		.trim()
		.custom(async (value, { req, location, path }) => {
			if (!source.includes(value)) {
				return Promise.reject(false);
			}
			if (value === Sources.AGENCY) {
				const { user } = req;
				// search merchant profile using source ID
			}
			return Promise.resolve(true);
		})
		.withMessage(`Unknown source`),
];

export const List = {
	fetch: [param("name").exists(), query("*").optional()],
};

export const Vend = {
	service: [...Offering, ...Params(), ...Source()],
};

export const NONE = [check("*").optional()];
