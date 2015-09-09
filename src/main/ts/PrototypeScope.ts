import {Scope, ObjectFactory} from "./InjectorDefinitions";

/**
 * <p>The Prototype scope always creates a new instance, whenever
 * it is supposed to resolve a bean.</p>
 */
export class PrototypeScope implements Scope {
	get(name:string, factory : ObjectFactory<any>) : any {
		return factory.build();
	}

	destroy() : void {
		// nothing on purpose, the beans are not tracked.
	}
}
