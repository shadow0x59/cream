export type MessageType =
	| 'application/json'
	| 'image/jpeg'
	| 'text/html'
	| 'text/css'
	| 'text/javascript'
	| 'text/plain';

export class Message<T = {} | String | Buffer | boolean> {
	constructor(
		public content: T,
		public contentType: MessageType = 'application/json',
		public status: number = 200
	) {}
}
