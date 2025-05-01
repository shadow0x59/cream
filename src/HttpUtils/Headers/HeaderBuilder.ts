/*
 * Copyright 2025 Raul Radu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface HeaderBuilderInterface {
	toConcreteHeader(): string | string[];
}

/**
 * This class is a helper cass used to build headers that implement
 * custom behaviours and serializing tecniques like cookies
 */
export class HeaderBuilder<T = string>
	extends Array<T>
	implements HeaderBuilderInterface
{
	/**
	 * This class extends Array<string> in order to add the simple but exaustive method
	 * toConcreteHeader that will convert any arraylike header into a format that is
	 * HTTP compliant. If there is only one element the returning string won't contain any
	 * separator.
	 *
	 * @param arraySeparator is the separator that will be used to build the final string.
	 * its default value is ', ' aka comma SP as for https://datatracker.ietf.org/doc/html/rfc9110#name-field-lines-and-combined-fi.
	 */
	constructor(private arraySeparator: string = ', ') {
		super();
	}

	/**
	 * This method is used to generate the final header based on its content
	 * It will return a string with elements separated by a comma.
	 * @returns the string that will correspond to the header. It can return
	 * an array of strings but this case is useful only for ResponseCookiesManager
	 */
	public toConcreteHeader(): string | string[] {
		return this.join(this.arraySeparator);
	}
}
