import { SupportedHttpMethods } from "@weaverkit/express";
import express from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ServerError, AppError } from "@weaverkit/errors";
import { App } from "@config";
import Redis from "@connections/redis";
import WPCore from "@libs/WPCore";

type ExcludedPath = { [k in SupportedHttpMethods]?: RegExp[] } | RegExp[];

interface AuthStrategyResponse {
	authorized: boolean;
	message?: string;
	code?: number;
	[key: string]: any;
}

interface AuthOptions {
	headerKey?: string;
	excludedPaths?: ExcludedPath;
	strategy: (token: string, ctx?: express.Request) => AuthStrategyResponse | Promise<AuthStrategyResponse>;
}

const runExclusions = (path: string, list: RegExp[]) => {
	for (const exp of list) {
		if (exp.test(path)) {
			return true;
		}
	}
	return false;
};

const excluded = (rq: express.Request, list: ExcludedPath) => {
	if (Array.isArray(list)) {
		return runExclusions(rq.path, list);
	} else if (typeof list === "object") {
		let ex = false;
		if (Array.isArray((list as any)[rq.method.toLowerCase()])) {
			ex = runExclusions(rq.path, (list as any)[rq.method.toLowerCase()]);
		}
		if (!ex && Array.isArray(list.all)) {
			ex = runExclusions(rq.path, list.all);
		}
		return ex;
	}
	return false;
};

export const authorize = async (token: string, ctx: any): Promise<AuthStrategyResponse> => {
	try {
		const response: any = await jwt.verify(token, App.JWT_SECRET);
		if (response) {
			const cached = await Redis.ActiveConnection.get(`${response.user_id}`);
			if (cached) {
				const parsedData = JSON.parse(cached);
				Object.assign(parsedData, { token });
				ctx.user = parsedData;
				return { authorized: true };
			} else {
				const { ok, data } = await WPCore.getProfile({ authToken: token, user: response });
				if (!ok && "message" in data) {
					return { authorized: false, message: data.message, code: 500 };
				} else {
					if ("is_banned" in data && data["is_banned"] !== "1") {
						return { authorized: false, message: "Unauthorized", code: 500 };
					}
					Object.assign(data, { id: response.user_id, msisdn: response.msisdn });
					await Redis.ActiveConnection.set(`${response.user_id}`, JSON.stringify(data));
					Object.assign(data, { token });
					ctx.user = data;
					return { authorized: true };
				}
			}
		}
		return { authorized: false, message: "Invalid authorization token provided", code: 401 };
	} catch (error: any) {
		console.log("AUTHENTICATION ERROR", error);
		if (error.message === "jwt expired") {
			return { authorized: false, message: "Authorization failed, Access token is expired", code: 401 };
		}
		return { authorized: false, message: "Unable to authenticate provided token", code: 401 };
	}
};

export const BearerAuth = ({ headerKey = "Bearer", excludedPaths = [], strategy }: AuthOptions) => {
	return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		try {
			if (excluded(req, excludedPaths)) {
				return next();
			}
			if (!req.headers.authorization) {
				throw new UnauthorizedError("Unauthorized").setCode("MISSING_AUTHORIZATION");
			}
			const parts = (req.headers.authorization as string).split(" ");
			if (parts.length !== 2 || parts[0] !== headerKey) {
				throw new UnauthorizedError("Invalid Authorization").setCode("INVALID_AUTHORIZATION");
			}
			const token = parts[1].trim();
			try {
				const state = await strategy(token, req);
				if (state.authorized === true) {
					return next();
				}
				throw new UnauthorizedError(state.message);
			} catch (error: any) {
				if (error instanceof AppError) {
					throw error;
				}
				throw new ServerError("Strategy Error").setInner(error);
			}
		} catch (error) {
			next(error);
		}
	};
};
