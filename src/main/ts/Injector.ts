/// <reference path="../../../node_modules/core-lang/core-lang.d.ts"/>

import { CorePromise as Promise } from "core-promise";
import { XCollection, XMap, XLinkedHashMap, XHashMap, list, XSet, XHashSet } from "core-lang";
import { argumentNames, create as createObject } from "core-lang/lib/reflect";
import { format } from "core-lang/lib/stringUtils";

import { ObjectFactory, ModuleEntry, Scope, Module } from "./InjectorDefinitions";
import {PrototypeScope} from "./PrototypeScope";
import {SingletonScope} from "./SingletonScope";
import {ModuleReader} from "./ModuleReader";

/**
	* A BeanBuilder is a helper class that will create a bean with the given beanDefinition.
	*/
class BeanBuilder<T> implements ObjectFactory<T> {
	constructor(public injector : Injector, public beanDefinition : ModuleEntry<T>) {
	}

	build() : any {
		if (this.beanDefinition.clazz) {
			return this.buildFromClass();
		} else {
			return this.buildFromBuilder();
		}
	}

	private buildFromClass() {
		var clazz = this.beanDefinition.clazz;

		return argumentNames(clazz).map(name => this.injector.getBean(name))
			.asPromises()
			.then((argumentValues : XCollection<any>) => createObject(clazz, argumentValues));
	}

	private buildFromBuilder() {
		var builder = this.beanDefinition.builder;

		return argumentNames(builder).map(name => this.injector.getBean(name))
			.asPromises()
			.then(function (argumentValues : XCollection<any>) {
				return builder.apply(this, argumentValues.asArray());
			});
	}
}

/**
	* <p>An Injector is an object that create object hierarchies with all their dependencies.</p>
	* <p>The injectors can be configured with one or more Modules. Modules represent packages
	* that contain object definitions.</p>
	* <p>By default the injector knows about two scopse: "singleton" and "prototype", but multiple
	* scopes can be registered to it using registerScope.</p>
	*/
export class Injector {
	private _scopes : XMap<string, Scope> = new XLinkedHashMap<string, Scope>();
	private _knownBeans: XMap<string, ModuleEntry<any>> = new XHashMap<string, ModuleEntry<any>>();

	private _parent : Injector;

	/**
		* Creates an injector reading the configuration from these modules.
		* @param parentInjector
		* @param modules
		*/
	constructor(parentInjector: Injector, ...modules);
	constructor(modules: Module[]);
	constructor(...modules : Module[]);
	constructor(...modules) {
		var i,
			j,
			moduleReader = new ModuleReader();

		this.registerScope("singleton", new SingletonScope());
		this.registerScope("prototype", new PrototypeScope());
		if (modules.length > 0 && modules[0] instanceof Injector) {
			this._parent = modules.shift();
		}

		moduleReader.readConfiguration(conf => {
			conf.register("injector").toInstance(this);
		}, this._knownBeans);

		for (i = 0; i < modules.length; i++) {
			if (modules[i] instanceof Array) {
				for (j = 0; j < modules[i].length; j++) {
					moduleReader.readConfiguration(modules[i][j], this._knownBeans);
				}
			} else {
				moduleReader.readConfiguration(modules[i], this._knownBeans);
			}
		}
	}

	/**
		* <p>Gets the bean instance, or creates it via its assigned scope.</p>
		* @param name
		* @returns {*}
		*/
	getBean<T>(name : string) : Promise<T> {
		return promiseCode(() => {
			var beanDefinition = this._knownBeans.get(name);

			if (typeof beanDefinition === "undefined" && !this._parent) {
				throw new Error(format("Unknown bean '{0}' defined in injector. Known beans are: {1}", name,
					this.getKnownBeans().join(", ")
				));
			} else if (typeof beanDefinition === "undefined") {
				return this._parent.getBean(name);
			}

			if (typeof beanDefinition.instance !== "undefined") {
				return beanDefinition.instance;
			} else {
				return this._findScope(beanDefinition.scope).get(
					beanDefinition.name,
					new BeanBuilder(this, beanDefinition),
					beanDefinition.scopeDestroy
				);
			}
		});
	}

	/**
		* Reports if the injector or one of its parent can construct a bean with the given name.
		* @param name
		* @returns {boolean}
		*/
	hasBean(name : string) : boolean {
		var beanDefinition = this._knownBeans.get(name);

		if (typeof beanDefinition === "undefined" && !this._parent) {
			return false;
		} else if (typeof beanDefinition === "undefined") {
			return this._parent.hasBean(name);
		}

		return true;
	}

	private _findScope(scopeName : string) {
		var result = this._scopes.get(scopeName);

		if (result) {
			return result;
		}

		if (this._parent) {
			return this._parent._findScope(scopeName);
		}

		throw new Error(format("Invalid scope name '{0}. Scope doesn't exists in injector.'", scopeName));
	}

	/**
	 * Resolves all the given bean names, and returns an object as a map
	 * with all the given objects.
	 */
	getBeans(...beanNames: string[]): Promise<{ [name: string] : any }> {
		return list(beanNames)
			.mapPromise(name => this.getBean(name))
			.then(beanValues => {
				var result = {};
	
				beanValues.forEach((it, index) => {
					result[beanNames[index]] = it;
				});
	
				return result;
			});
	}

	private getKnownBeans() : XSet<string> {
		var beans : XSet<string>;

		if (this._parent) {
			beans = this._parent.getKnownBeans();
		} else {
			beans = new XHashSet<string>();
		}

		beans.addAll( this._knownBeans.keys() );

		return beans;
	}

	/**
		* <p>Finds the object that has the class of the given type.</p>
		* @param type
		* @returns {*}
		*/
	getByType<T>(type: {new() : T}) : Promise<T> {
		return new Promise<T>(function(resolve, reject) {
			var item = this._knownBeans.values().findFirst(it => it.instance instanceof type);
			if (item) {
				resolve(item.instance);
			}

			resolve(null);
		});
	}

	/**
		* <p>Finds all the objects that are created and known to this injector, that have the given type.</p>
		* <p>The instances must be already existing.</p>
		* @param type
		* @returns {Collection<ModuleEntry>}
		*/
	getAllByType<T>(type) : Promise<XCollection<T>> {
		return new Promise<XCollection<T>>(function(resolve, reject) {
			var result = this._knownBeans.values()
				.filter(it => it.instance instanceof type)
				.map(it => it.instance);
			
			resolve(result);
		});
	}

	/**
		* <p>Registers a new scope into the injector.</p>
		*/
	registerScope(name : string, scope : Scope) {
		this._scopes.put(name, scope);
	}

	/**
		* Removes a scope from an injector.
		* @param name
		*/
	unregisterScope(name : string) {
		this._scopes.removeKey(name);
	}

	destroy(scopeName) {
		var scope = this._scopes.findFirst(scopeEntry => scopeEntry.key === scopeName);
		if (scope) {
			scope.value.destroy();
		}

		if (this._parent) {
			this._parent.destroy(scopeName);
		}
	}
}
