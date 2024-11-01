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

import { NextFunction, Request, Response } from 'express';
import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';

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
		public readonly collectionName = 'default',
		public readonly content?: T
	) {}
}
