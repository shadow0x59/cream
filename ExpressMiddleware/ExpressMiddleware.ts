import {NextFunction, Request, Response} from 'express';

import {RestError} from '../ExpressErrorHandler/ExpressErrorHandler';

export type MiddlewareDataCollection = {}|undefined;

export type MiddlewareDataCollections = Map<String, MiddlewareDataCollection>;

export interface ExtendedRequest extends Request {
  middlewareDataCollections?: MiddlewareDataCollections;
}

export interface BaseMiddleware {
  handle(req: Request, res: Response, next: NextFunction): void|Promise<void>;
}

export abstract class AsyncExpressMiddleware<T> implements BaseMiddleware {
  public abstract behaviour(req: ExtendedRequest, res: Response):
      Promise<MiddlewareReturnData<T>>;

  async handle(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      let data: MiddlewareReturnData<T> = await this.behaviour(req, res);
      let collections: MiddlewareDataCollections =
          req.middlewareDataCollections || new Map();
      if (data.content) {
        collections.set(data.collectionName, data.content);
      }
      req.middlewareDataCollections = collections;

      next();
    } catch (e) {
      if (e instanceof RestError) {
        res.status((e as RestError).statusCode);
      } else {
        res.status(500);
      }
      next(e);
    }
  }
}

export abstract class ExpressMiddleware implements BaseMiddleware {
  public abstract behaviour(req: ExtendedRequest, res: Response):
      MiddlewareReturnData;

  handle(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      let data: MiddlewareReturnData = this.behaviour(req, res);
      let collections: MiddlewareDataCollections =
          req.middlewareDataCollections || new Map();
      collections.set(data.collectionName, data.content);
      req.middlewareDataCollections = collections;

      next();
    } catch (e) {
      if (e instanceof RestError) {
        res.status((e as RestError).statusCode);
      } else {
        res.status(500);
      }
      next(e);
    }
  }
}

export type BaseMiddlewares = BaseMiddleware[];

export class MiddlewareReturnData<T = {}> {
  constructor(
      public readonly content?: T, public readonly collectionName = 'default') {
  }
}
