import { Router } from 'express';
import { ExpressMiddlewares } from '../ExpressMiddleware/ExpressMiddleware';
import { ExpressApplication } from '../ExpressApplication';

export class ExpressModule {
	public accessor router: Router;
	public accessor baseUrl: string;
	public accessor className: string;
	private _app!: ExpressApplication;

	constructor(public middlewareList: ExpressMiddlewares = []) {
		this.router = Router();
		this.baseUrl = '/';
		this.className = '';
	}

	public set app(v: ExpressApplication) {
		this._app = v;
	}

	public get app(): ExpressApplication {
		return this._app;
	}
}

export type ExpressModules = ExpressModule[];
