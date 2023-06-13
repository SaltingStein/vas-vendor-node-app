import shortid from "shortid";
import Interpolator from "string-interpolation";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import fs from "fs";
const fsPromises = fs.promises;
import path from "path";
import crypto from "crypto";

export const interpolator = new Interpolator({
	delimiter: ["{{", "}}"],
});

// tslint:disable-next-line: no-empty
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

export const isSameDay = (date: Date, compare = new Date()) => {
	return moment(date).isSame(moment(compare), "day");
};

export const defaultReportExtension = ".xlsx";

export async function deleteTempFile(fileName: string) {
	try {
		await fsPromises.unlink(path.resolve(__dirname, `../temp/${fileName}${defaultReportExtension}`));
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}

	console.log(`${fileName} deleted successfully`);
	return fileName;
}

export function formatNumber(num: string | number) {
	if (typeof num === "string") {
		num = parseInt(num, 10);
		// console.log(num);
	}
	return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

export function formatNumberAsCurrency(num: string | number) {
	if (typeof num === "string") {
		num = Number(num);
		// console.log(num);
	}
	return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}
