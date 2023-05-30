import { SupportedHttpMethods } from "@weaverkit/express";
import express from "express";
import { UnauthorizedError, ServerError, AppError } from "@weaverkit/errors";

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

export const BearerAuth = ({ headerKey = "Bearer", excludedPaths = [], strategy }: AuthOptions) => {
	return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
		try {
			if (excluded(req, excludedPaths)) {
				return next();
			}
			if (!req.headers.authorization) {
				throw new UnauthorizedError("Missing Authorization Key").setCode("MISSING_AUTHORIZATION");
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
				throw new UnauthorizedError().setInfo(state);
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
