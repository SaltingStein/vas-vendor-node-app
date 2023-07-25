import shortid from "shortid";
import Interpolator from "string-interpolation";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
const fsPromises = fs.promises;
import crypto from "crypto";

export const interpolator = new Interpolator({
	delimiter: ["{{", "}}"],
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (...args: any[]): any => {};

export const readFileToStringAsync = async (filePath: string) => {
	try {
		const fileContent = await fsPromises.readFile(filePath, "utf8");
		return fileContent;
	} catch (error) {
		console.error("Error reading file content");
		console.error(error);
	}
};

export const generateHmacHash = (message: string, secretKey: string, algorithm: string) => {
	const hmac = crypto.createHmac(algorithm, secretKey);
	const data = hmac.update(message);
	const genHmac = data.digest("hex");

	return genHmac;
};

export const getUniqueReference = () => {
	return uuidv4();
};

export const getShortId = () => {
	return shortid.generate();
};

export const getRandom = (digits: number) => {
	// tslint:disable-next-line: radix
	return Math.floor(Math.random() * parseInt("8" + "9".repeat(digits - 1)) + parseInt("1" + "0".repeat(digits - 1)));
};

export const verifyPhoneNumber = (phone: string) => {
	return /^([0]{1}|\+?[234]{3})([7-9]{1})([0|1]{1})([\d]{1})([\d]{7})$/g.test(phone);
};

export const sanitizePhoneNumber = (phoneNo: string, code = "234") => {
	let phone = String(phoneNo);
	const firstChar = phone.charAt(0);
	if (firstChar === "0" || firstChar === "+") {
		phone = phone.substring(1);
	}
	if (phone.substring(0, 3) === code) {
		return phone;
	}
	return code + phone;
};

export function formatNumberAsCurrency(num: string | number) {
	if (typeof num === "string") {
		num = Number(num);
		// console.log(num);
	}
	return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function formatListResponse(data: object[]) {
	let response: any = {};
	for (const element of data) {
		if ("code" in element) {
			response = Object.assign(response, { [element.code as string]: element });
		}
	}

	return response;
}
