import { body, check, param, query } from "express-validator/check";
import { App } from "@config";
export const SOURCES = ["agency"];
export const PRODUCTS = ["airtime", "electricity", "cabletv", "databundle", "utilitybundle"];
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
	body("params.productType").exists().withMessage("params.productType is required"),
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
	body("source.sourceId").customSanitizer(() => {
		return App.ADMIN_MISDN;
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
		.custom(async (value) => {
			if (!source.includes(value)) {
				return Promise.reject(false);
			}
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

export const CashtokenBundle = {
	create: [
		body("code")
			.custom((value) => {
				if (!value) {
					return false;
				} else {
					return true;
				}
			})
			.withMessage("code is required"),
		body("productType")
			.custom((value) => {
				if (!value) {
					return false;
				} else {
					return true;
				}
			})
			.withMessage("productType is required"),
		body("productName")
			.custom((value) => {
				if (!value) {
					return false;
				} else {
					return true;
				}
			})
			.withMessage("productName is required"),
	],
	fetchProviders: [param("service").exists(), query("*")],
};

export const NONE = [check("*").optional()];
