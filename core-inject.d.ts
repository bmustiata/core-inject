declare module 'core-inject/lib/InjectorDefinitions' {
	import { ClassDefinition } from "core-lang/lib/reflect";
	/**
	    * A module entry is a configuration for a bean.
	    */
	export class ModuleEntry<T> {
	    name: string;
	    clazz: ClassDefinition<T>;
	    instance: any;
	    scope: string;
	    scopeDestroy: Function;
	    builder: BeanBuilder;
	    constructor(name: string);
	    to(clazz: Function): ModuleEntry<T>;
	    to(clazz: {
	        new (...any): T;
	        apply: Function;
	    }): ModuleEntry<T>;
	    toBuilder(builder: BeanBuilder): ModuleEntry<T>;
	    toInstance(instance: any): ModuleEntry<T>;
	    inScope(scope: string): ModuleEntry<T>;
	    onScopeDestroy(f: Function): ModuleEntry<T>;
	}
	export interface ModuleConfiguration {
	    register<T>(name: string): ModuleEntry<T>;
	}
	/**
	    * <p>A Module represents a set of settings for what objects are supposed to be available, and in
	    * what scopes.</p>
	    */
	export interface Module {
	    (config: ModuleConfiguration): void;
	}
	/**
	    * <p>A Module represents a set of settings for what objects are supposed to be available, and in
	    * what scopes.</p>
	    * <p>A module object represents an object that can be called multiple times in order to fetch
	    * the configuration.</p>
	    */
	export class ModuleObject {
	    configure(config: ModuleConfiguration): void;
	    getModule(): Module;
	}
	/**
	    * <p>An ObjectFactory is passed to a Scope when the scope doesn't contains the object and it needs
	    * create it.</p>
	    */
	export interface ObjectFactory<T> {
	    build(): T;
	}
	export interface BeanBuilder {
	    (...any: any[]): any;
	}
	/**
	    * <p>A scope
	    */
	export interface Scope {
	    get<T>(name: string, factory: ObjectFactory<T>, onDestroyCallback?: Function): any;
	    destroy(): void;
	}

}
declare module 'core-inject/lib/Injector' {
	/// <reference path="../node_modules/grunt-typescript/node_modules/typescript/bin/lib.es6.d.ts" />
	/// <reference path="../node_modules/core-lang/core-lang.d.ts" />
	/// <reference path="../node_modules/core-promise/core-promise.d.ts" />
	import { XCollection } from "core-lang";
	import { Scope, Module } from 'core-inject/lib/InjectorDefinitions';
	/**
	    * <p>An Injector is an object that create object hierarchies with all their dependencies.</p>
	    * <p>The injectors can be configured with one or more Modules. Modules represent packages
	    * that contain object definitions.</p>
	    * <p>By default the injector knows about two scopse: "singleton" and "prototype", but multiple
	    * scopes can be registered to it using registerScope.</p>
	    */
	export class Injector {
	    private _scopes;
	    private _knownBeans;
	    private _parent;
	    /**
	        * Creates an injector reading the configuration from these modules.
	        * @param parentInjector
	        * @param modules
	        */
	    constructor(parentInjector: Injector, ...modules: any[]);
	    constructor(modules: Module[]);
	    constructor(...modules: Module[]);
	    /**
	        * <p>Gets the bean instance, or creates it via its assigned scope.</p>
	        * @param name
	        * @returns {*}
	        */
	    getBean<T>(name: string): Promise<T>;
	    /**
	        * Reports if the injector or one of its parent can construct a bean with the given name.
	        * @param name
	        * @returns {boolean}
	        */
	    hasBean(name: string): boolean;
	    private _findScope(scopeName);
	    /**
	     * Resolves all the given bean names, and returns an object as a map
	     * with all the given objects.
	     */
	    getBeans(...beanNames: string[]): Promise<{
	        [name: string]: any;
	    }>;
	    private getKnownBeans();
	    /**
	        * <p>Finds the object that has the class of the given type.</p>
	        * @param type
	        * @returns {*}
	        */
	    getByType<T>(type: {
	        new (): T;
	    }): Promise<T>;
	    /**
	        * <p>Finds all the objects that are created and known to this injector, that have the given type.</p>
	        * <p>The instances must be already existing.</p>
	        * @param type
	        * @returns {Collection<ModuleEntry>}
	        */
	    getAllByType<T>(type: any): Promise<XCollection<T>>;
	    /**
	        * <p>Registers a new scope into the injector.</p>
	        */
	    registerScope(name: string, scope: Scope): void;
	    /**
	        * Removes a scope from an injector.
	        * @param name
	        */
	    unregisterScope(name: string): void;
	    destroy(scopeName: any): void;
	}

}
declare module 'core-inject/lib/ModuleReader' {
	import { XMap } from "core-lang";
	import { Module, ModuleEntry } from 'core-inject/lib/InjectorDefinitions';
	export class ModuleReader {
	    readConfiguration(injectModule: Module, definitions: XMap<string, ModuleEntry<any>>): void;
	}

}
declare module 'core-inject/lib/PrototypeScope' {
	import { Scope, ObjectFactory } from 'core-inject/lib/InjectorDefinitions';
	/**
	 * <p>The Prototype scope always creates a new instance, whenever
	 * it is supposed to resolve a bean.</p>
	 */
	export class PrototypeScope implements Scope {
	    get(name: string, factory: ObjectFactory<any>): any;
	    destroy(): void;
	}

}
declare module 'core-inject/lib/SingletonScope' {
	/// <reference path="../node_modules/core-lang/core-lang.d.ts" />
	import { Scope, ObjectFactory } from 'core-inject/lib/InjectorDefinitions';
	/**
	    * <p>A singleton scope holds exactly one instance of the object with
	    * the given name.</p>
	    */
	export class SingletonScope implements Scope {
	    private _storage;
	    private _destroyCallbacks;
	    get(name: string, factory: ObjectFactory<any>, onDestroyCallback?: Function): any;
	    destroy(): void;
	}

}
declare module 'core-inject/lib/injectorInvoke' {
	import { Injector } from 'core-inject/lib/Injector';
	/**
	    * Invoke a function filling its parameters with values from the injector. In case
	    * params has values, these are the first parameters passed to the function, and the
	    * injector will not be called for this.
	    * @param injector
	    * @param fn
	    * @param params
	    */
	export function injectorCall(injector: Injector, fn: Function, ...params: any[]): Promise<any>;
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
	export function injectorInvoke(injector: Injector, thisObject: any, fn: Function, ...params: any[]): Promise<any>;

}
declare module 'core-inject' {
	import main = require('core-inject/lib/Injector');
	export = main;
}
