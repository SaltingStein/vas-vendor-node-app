export const enumerable = (state: boolean, writable = true) => {
	return (target: any, propertyKey: string) => {
		const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {};
		if (descriptor.enumerable !== state) {
			Object.defineProperty(target, propertyKey, {
				enumerable: state,
				set(value: any) {
					Object.defineProperty(this, propertyKey, {
						enumerable: state,
						writable,
						value,
					});
				},
			});
		}
	};
};
