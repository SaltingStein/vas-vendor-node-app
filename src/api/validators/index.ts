import { body, check, param, query } from "express-validator/check";

export const NONE = [check("*").optional()];
