import { ClassDefinition } from "core-lang/lib/reflect";

/**
	* A module entry is a configuration for a bean.
	*/
export class ModuleEntry<T> {
	name : string;
	clazz: ClassDefinition<T>;
	instance : any;
	scope : string = "singleton"; // the default scope is a singleton.
	scopeDestroy : Function;
	builder : BeanBuilder;

	constructor(name : string) {
		this.name = name;
	}

	to(clazz: Function) : ModuleEntry<T>;
	to(clazz: {new(...any) : T; apply: Function}) : ModuleEntry<T>;
	to(clazz: any) : ModuleEntry<T> {
		this.clazz = clazz;

		return this;
	}

	toBuilder(builder: BeanBuilder) : ModuleEntry<T> {
		this.builder = builder;

		return this;
	}

	toInstance(instance : any) : ModuleEntry<T> {
		this.instance = instance;

		return this;
	}

	inScope(scope : string) : ModuleEntry<T> {
		this.scope = scope;

		return this;
	}

	onScopeDestroy(f : Function) : ModuleEntry<T> {
		this.scopeDestroy = f;

		return this;
	}
}

export interface ModuleConfiguration {
	register<T>(name : string) : ModuleEntry<T>;
}

/**
	* <p>A Module represents a set of settings for what objects are supposed to be available, and in
	* what scopes.</p>
	*/
export interface Module {
	(config : ModuleConfiguration) : void;
}

/**
	* <p>A Module represents a set of settings for what objects are supposed to be available, and in
	* what scopes.</p>
	* <p>A module object represents an object that can be called multiple times in order to fetch
	* the configuration.</p>
	*/
export class ModuleObject {
	configure(config : ModuleConfiguration) : void {
		throw new Error("abstract method");
	}

	getModule() : Module {
		return (config) => {
			this.configure(config);
		}
	}
}

/**
	* <p>An ObjectFactory is passed to a Scope when the scope doesn't contains the object and it needs
	* create it.</p>
	*/
export interface ObjectFactory<T> {
	build() : T;
}

export interface BeanBuilder {
	(...any) : any;
}

/**
	* <p>A scope
	*/
export interface Scope {
	get<T>(name : string, factory : ObjectFactory<T>, onDestroyCallback? : Function) : any;
	destroy() : void;
}
