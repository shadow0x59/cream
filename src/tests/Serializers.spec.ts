/*
 * Copyright 2024 Raul Radu
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

import {
	CreamSerializers,
	Serializable,
	AutoMap,
	MapTo,
	BootstrapSerializer,
	Meta,
	JSONSerializableArray,
} from '..';

let bootstrap = new BootstrapSerializer();

class NonSerializableObject {
	public attrib: number = 6;
}

describe('BootstrapSerializer serialization test', () => {
	it('Should serialize numbers as plain', async () => {
		expect(await bootstrap.start(4)).toEqual('4');
	});

	it('Should serialize strings as plain', async () => {
		expect(await bootstrap.start('test')).toEqual('test');
	});

	it('Should serialize boolean as plain', async () => {
		expect(await bootstrap.start(false)).toEqual('false');
	});

	it('Should serialize null as plain text', async () => {
		expect(await bootstrap.start(null)).toBe('null');
	});

	it('Should not serialize non-serializable object', async () => {
		expect(bootstrap.start(new NonSerializableObject())).rejects.toThrow();
	});
});

@Serializable(CreamSerializers.JSON)
class ArraySerializerTest {
	@AutoMap
	public myData: string = 'test-working';
}
@Serializable(CreamSerializers.JSON)
class Test1JSONSerializableNested {
	@MapTo('notWorking')
	isNotWorking: boolean = false;
}

@Serializable(CreamSerializers.JSON)
class Test1JSONSerializable {
	@AutoMap
	test: string = 'isWorking';

	@AutoMap
	testNum: number = 1;

	@AutoMap
	testBool: boolean = true;

	@AutoMap
	testNull: null = null;

	@AutoMap
	nested: Test1JSONSerializableNested = new Test1JSONSerializableNested();
}

describe('JSON Serialization tests', () => {
	it('Should serialize the object of type Test1JSONSerializable', async () => {
		let targetString =
			'{"test":"isWorking","testNum":1,"testBool":true,"testNull":null,"nested":{"notWorking":false}}';
		let objectTbs = new Test1JSONSerializable();

		let data = await bootstrap.start(objectTbs);

		expect(data).toEqual(targetString);
	});

	it('Should serialize a top level array of custom objects', async () => {
		let dataTbs: JSONSerializableArray<ArraySerializerTest> =
			new JSONSerializableArray([
				new ArraySerializerTest(),
				new ArraySerializerTest(),
			]);

		let data = await bootstrap.start(dataTbs);

		let targetString =
			'[{"myData":"test-working"},{"myData":"test-working"}]';

		expect(data).toEqual(targetString);
	});

	it('Should serialize a top level array of numbers', async () => {
		let dataTbs = new JSONSerializableArray<number>([1, 2, 3, 4]);

		let data = await bootstrap.start(dataTbs);

		expect(data).toEqual('[1,2,3,4]');
	});

	it('Should serialize a top level array of strings', async () => {
		let dataTbs = new JSONSerializableArray<string>(['1', '2', '3', '4']);

		let data = await bootstrap.start(dataTbs);

		expect(data).toEqual('["1","2","3","4"]');
	});

	it('Should serialize a top level array of booleans', async () => {
		let dataTbs = new JSONSerializableArray<boolean>([
			true,
			false,
			true,
			false,
		]);

		let data = await bootstrap.start(dataTbs);

		expect(data).toEqual('[true,false,true,false]');
	});

	it('Should return a top level array of arrays', async () => {
		let dataTbs = new JSONSerializableArray<number[]>([
			[1, 2],
			[3, 4],
			[1, 2],
		]);
		let data = await bootstrap.start(dataTbs);
		expect(data).toMatch('[[1,2],[3,4],[1,2]]');
	});
});

@Serializable(CreamSerializers.XML)
class NestedXML {
	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public notWorking: boolean = false;
}
@Serializable(CreamSerializers.XML)
class NestedWithData {
	@Meta(CreamSerializers.XML.Attribute)
	@MapTo('attrib')
	public myCustomAttrib: string = 'test';

	@Meta(CreamSerializers.XML.Text)
	@AutoMap
	public data: string = 'This contains data';
}

@Serializable(CreamSerializers.XML)
class Test1XMLSerializable {
	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public status: string = 'isWorking';

	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public testNum: number = 1;

	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public testBool: boolean = true;

	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public testNull: boolean | null = null;

	@AutoMap
	public nestedElem: NestedXML = new NestedXML();

	@AutoMap
	public nestedWithData: NestedWithData = new NestedWithData();
}

@Serializable(CreamSerializers.XML)
class ArrayElem {
	@Meta(CreamSerializers.XML.Attribute)
	@AutoMap
	public customAttrib: string;

	@Meta(CreamSerializers.XML.Text)
	@AutoMap
	public data: string;

	constructor(customAttrib: string, data: string) {
		this.customAttrib = customAttrib;
		this.data = data;
	}
}

@Serializable(CreamSerializers.XML)
class ArrayContainer {
	@Meta(CreamSerializers.XML.AddIndex)
	@AutoMap
	dataArray: ArrayElem[] = [
		new ArrayElem('custom1', 'data1'),
		new ArrayElem('custom2', 'data2'),
	];
}

@Serializable(CreamSerializers.XML)
class Test2XML {
	@AutoMap
	fieldNum: number = 1;

	@AutoMap
	fieldBool1: boolean = true;

	@AutoMap
	fieldBool2: boolean = false;

	@AutoMap
	fieldString: string = 'Test';

	@AutoMap
	fieldNull: string | null = null;
}

describe('XML Serialization tests', () => {
	it('Should serialize the object of type Test1XMLSerializable', async () => {
		let targetString =
			'<Test1XMLSerializable status="isWorking" testNum="1" testBool="true" testNull="null">' +
			'<NestedXML notWorking="false"/>' +
			'<NestedWithData attrib="test">This contains data</NestedWithData>' +
			'</Test1XMLSerializable>';

		let objectTbs = new Test1XMLSerializable();

		let data = await bootstrap.start(objectTbs);

		expect(data).toEqual(targetString);
	});

	it('Should serialize an object that contains a number, two boo, a string and a null as children', async () => {
		let targetString =
			'<Test2XML>' +
			'<fieldNum>1</fieldNum>' +
			'<fieldBool1>true</fieldBool1>' +
			'<fieldBool2>false</fieldBool2>' +
			'<fieldString>Test</fieldString>' +
			'<fieldNull/>' +
			'</Test2XML>';

		let objectTbs = new Test2XML();

		let data = await bootstrap.start(objectTbs);

		expect(data).toEqual(targetString);
	});

	it('Should serialize the object that contains an array', async () => {
		let targetString =
			'<ArrayContainer>' +
			'<dataArray index="0"><ArrayElem customAttrib="custom1">data1</ArrayElem></dataArray>' +
			'<dataArray index="1"><ArrayElem customAttrib="custom2">data2</ArrayElem></dataArray>' +
			'</ArrayContainer>';

		let objectTbs = new ArrayContainer();

		let data = await bootstrap.start(objectTbs);

		expect(data).toEqual(targetString);
	});
});
