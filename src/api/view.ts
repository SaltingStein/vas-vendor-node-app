import { ViewFactory } from "@weaverkit/data";
import path from "path";

export const View = ViewFactory({ path: path.resolve(__dirname, "./../../views/") });
