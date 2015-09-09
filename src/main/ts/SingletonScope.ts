/// <reference path="../../../node_modules/core-lang/core-lang.d.ts"/>

import {Scope,ObjectFactory} from "./InjectorDefinitions";
import {XMap,XHashMap,XMapEntry} from "core-lang";

/**
	* <p>A singleton scope holds exactly one instance of the object with
	* the given name.</p>
	*/
export class SingletonScope implements Scope {
	private _storage: XMap<string, any> = new XHashMap<string, any>();
	private _destroyCallbacks: XMap<string, Function> = new XHashMap<string, Function>();

	get(name:string, factory : ObjectFactory<any>, onDestroyCallback? : Function) : any {
		var result;

		if (this._storage.hasKey(name)) {
			return this._storage.get(name);
		}

		result = factory.build();

		this._storage.put(name, result);

		if (onDestroyCallback) {
			this._destroyCallbacks.put(name, onDestroyCallback);
		}

		return result;
	}

	destroy() : void {
		this._destroyCallbacks.forEach((entry: XMapEntry<string, Function>) => {
			entry.value(this._storage.get(entry.key));
		});
	}
}
