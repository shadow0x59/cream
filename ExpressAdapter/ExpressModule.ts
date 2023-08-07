import { Router } from 'express';
import { ExpressMiddleware } from '../ExpressMiddleware/ExpressMiddleware';
import { Constructables } from '../Utils/Constructable';

export class ExpressModule {
	public accessor router: Router;
	public accessor baseUrl: string;
	public accessor className: string;

	constructor(public middlewareList: Constructables<ExpressMiddleware> = []) {
		this.router = Router();
		this.baseUrl = '/';
		this.className = '';
	}
}

export type ExpressModules = ExpressModule[];
