import { HeaderBuilderInterface } from './HeaderBuilder';
import { HeaderNames } from './HeadersDef';

/**
 * This class is a helper class used to manage header builders
 * It is an extension of the standard Map<HeaderNames, HeaderBuilderInterface> class
 */
export class HeadersManager extends Map<HeaderNames, HeaderBuilderInterface> {
	/**
	 * Returns the header builder associated with the key and it autocasts it to
	 * whatever type T is as long as T implements HeaderBuilderInterface
	 * @param key The header we want to retrieve the header builder for
	 * @returns the header builder associated with the key or undefined if no header
	 * builder is associated with such key
	 */
	getAs<T extends HeaderBuilderInterface>(key: HeaderNames): T | undefined {
		return this.get(key) as T;
	}
}
