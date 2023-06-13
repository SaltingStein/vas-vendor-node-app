export = Interpolator;
declare class Interpolator {
	constructor(options: any);
	options: any;
	modifiers: any;
	aliases: any;
	addAlias(key: any, ref: any): any;
	applyData(key: any, data: any): any;
	applyModifiers(modifiers: any, str: any, rawData: any): any;
	applyRule(str: any, rule: any, data: any): any;
	delimiterEnd(): any;
	delimiterStart(): any;
	extractAfter(str: any, val: any): any;
	extractRules(matches: any): any;
	getAlternativeText(str: any): any;
	getFromAlias(key: any): any;
	getKeyFromMatch(match: any): any;
	getModifier(key: any): any;
	getModifiers(str: any): any;
	parse(str: any, data: any): string;
	parseFromRules(str: any, data: any, rules: any): any;
	parseRules(str: any): any;
	registerBuiltInModifiers(): any;
	registerModifier(key: any, transform: any): any;
	removeAfter(str: any, val: any): any;
	removeAlias(key: any): any;
	removeDelimiter(val: any): any;
}
