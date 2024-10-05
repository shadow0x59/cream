import { ParameterProp } from '../ExpressAdapter/ParameterProp';
import { MIDDLEWARE_METADATA_KEY } from '../ExpressAdapter/ExpressAdapters';

export class MiddlewareParameterProp extends ParameterProp {
	constructor(
		index: number,
		name: string,
		public readonly collection: string
	) {
		super(index, name);
	}
}

export type MiddlewareParameterProps = MiddlewareParameterProp[];

export function MiddlewareData(
	collectionName: string = 'default',
	dataName: string = '$'
) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingRequiredParameters: MiddlewareParameterProps =
			Reflect.getOwnMetadata(
				MIDDLEWARE_METADATA_KEY,
				target,
				propertyKey
			) || [];
		existingRequiredParameters.push(
			new MiddlewareParameterProp(
				parameterIndex,
				dataName,
				collectionName
			)
		);
		Reflect.defineMetadata(
			MIDDLEWARE_METADATA_KEY,
			existingRequiredParameters,
			target,
			propertyKey
		);
	};
}
