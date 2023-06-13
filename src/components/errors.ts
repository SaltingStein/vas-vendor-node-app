export abstract class AppError extends Error {
	public abstract httpCode: number;
	public reportable = true;
	public data!: any;

	protected client!: any;

	constructor(message?: any) {
		super(message);
		// restore prototype chain
		this.name = this.constructor.name;
		// Object.setPrototypeOf(this, new.target.prototype);
	}

	public setData(data: any) {
		this.data = data;
		return this;
	}

	public setClient({ name = "N/A", scope = "N/A", _id = "N/A" }: any) {
		this.client = { id: _id, name, scope };
		return this;
	}

	public switchReportable() {
		this.reportable = !this.reportable;
		return this;
	}

	protected toString() {
		let original = super.toString();
		if (this.data) {
			let data;
			if (Array.isArray(this.data) || typeof this.data === "object") {
				data = JSON.stringify(this.data);
			} else {
				data = this.data;
			}
			original += `\n Data: ${data}\n\n Stack: ${this.stack}`;
		}
		return original;
	}
}

export class ValidationError extends AppError {
	public httpCode = 422;
	public reportable = true;
	public input!: any;
	constructor(message = "Input Validation Error") {
		super(message);
	}

	public setInput(input: any) {
		this.input = input;
		return this;
	}
}

export class FailedDependencyError extends AppError {
	public httpCode = 424;
	public reportable = true;
	public input!: any;
	private maskedData!: any;
	constructor(reason = "Unknown") {
		super(`${reason}`);
	}

	public setInput(input: any) {
		this.input = input;
		return this;
	}

	public setData(data: any) {
		this.maskedData = data;
		return this;
	}
}

export class BadRequestError extends AppError {
	public httpCode = 400;
}

export class ForbiddenError extends AppError {
	public httpCode = 403;
}

export class InvalidArgumentError extends BadRequestError {}

export class InvalidActionError extends BadRequestError {}

export class NotFoundError extends AppError {
	public httpCode = 404;
}

abstract class MaskedError extends AppError {
	public originalError!: any;
	private maskedData!: any;

	constructor(msg: string, originalError?: any) {
		super(msg);
		if (originalError) {
			const { message, stack, ...rest } = originalError;
			this.originalError = { message, rest, stack };
		}
	}

	public setData(data: any) {
		this.maskedData = data;
		return this;
	}
}

export class ServiceUnavailableError extends MaskedError {
	public httpCode = 503;
	constructor(public serviceName?: string, originalError?: any) {
		super("Service unavailable at the moment", originalError);
	}
}

export class ServerError extends MaskedError {
	public httpCode = 500;

	constructor(originalError?: any) {
		super("Server Error", originalError);
	}
}

export class HttpError extends AppError {
	constructor(public httpCode: number, message?: string) {
		super(message);
	}
}

// throw new AppError("This is a test").setData({recipient: "me"});
