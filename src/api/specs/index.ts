import { OpenApiBuilder } from "openapi3-ts/oas31";

export const builder = new OpenApiBuilder();
builder.addInfo({
	title: "My Awesome App",
	version: "1.0.0",
});

export const getSpec = () => {
	return builder.getSpec();
};
