export * as Electricity from "./electricity";
export * as CableTv from "./cableTv";
export * as Airtime from "./airtime";
export * as DataBundle from "./dataBundle";
export const services = {
	airtime: ["MTN", "Airtel", "Glo", "Etisalat"],
	electricity: ["AEDC", "EKEDC", "EEDC", "IKEDC", "JEDC", "KAEDCO", "KEDCO", "BEDC"],
	cableTv: ["DSTV", "GOTV", "Startimes", "Showmax"],
	dataBundle: ["MTN", "Airtel", "Glo", "Etisalat", "Smile", "Spectranet"],
};
