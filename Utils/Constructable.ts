export type Constructable<T = {}> = { new (...args: any): T };

export type Constructables<T = {}> = Constructable<T>[];
