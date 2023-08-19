import { ExpressApplication } from '../ExpressApplication';

export abstract class ExpressService {
	private _app?: ExpressApplication;
	protected _id?: string;

	abstract init(): Promise<boolean>;

	public set app(v: ExpressApplication) {
		this._app = v;
	}

	public get app(): ExpressApplication | undefined {
		return this._app;
	}

	public get id() {
		return this._id;
	}
}

export type ExpressServices = ExpressService[];

export function IdentifiedBy<T extends { new (...args: any[]): any }>(
	id: string
) {
	return function (target: T): T {
		return class extends target {
			constructor(...args: any[]) {
				super(...args);
				super._id = id;
			}
		};
	};
}
