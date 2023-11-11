import { ExpressApplication } from '../ExpressApplication';

export abstract class ExpressService {
	private _app!: ExpressApplication;
	private _id!: string;

	abstract init(): Promise<boolean>;

	public set app(v: ExpressApplication) {
		this._app = v;
	}

	public get app(): ExpressApplication {
		return this._app;
	}

	public get id() {
		return this._id;
	}

	public static IdentifiedBy<T extends { new (...args: any[]): any }>(
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
}

export type ExpressServices = ExpressService[];
