import {Injector} from "./Injector";
import {argumentNames, invoke} from "core-lang/lib/reflect"
import {DefaultPromise as Promise} from "core-promise"

/**
	* Invoke a function filling its parameters with values from the injector. In case
	* params has values, these are the first parameters passed to the function, and the
	* injector will not be called for this.
	* @param injector
	* @param fn
	* @param params
	*/
export function injectorCall(injector : Injector, fn : Function, ...params : any[]) : Promise<any> {
	return argumentNames(fn).map(function(name, index) {
			if (index < params.length) {
				return Promise.resolve( params[index] );
			} else {
				return injector.getBean(name);
			}
		})
	.resolvePromises()
	.then(parameters => invoke(fn, parameters));
}

/**
	* Invoke a function filling its parameters with values from the injector. In case
	* params has values, these are the first parameters passed to the function, and the
	* injector will not be called for this. The thisObject will be used as this for the
	* function.
	* @param injector
	* @param thisObject
	* @param fn
	* @param params
	*/
export function injectorInvoke(injector : Injector, thisObject : any, fn : Function, ...params : any[]) : Promise<any> {
	return argumentNames(fn).map((name, index) => {
		if (index < params.length) {
			return Promise.resolve( params[index] );
		} else {
			return injector.getBean(name);
		}
	})
	.resolvePromises()
	.then(parameters => fn.apply(thisObject, parameters.asArray()));
}
