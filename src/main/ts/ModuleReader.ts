
import { XMap } from "core-lang";

import {Module, ModuleEntry} from "./InjectorDefinitions";

export class ModuleReader {
	readConfiguration(injectModule: Module, definitions: XMap<string, ModuleEntry<any>>) {
		injectModule({
			register : function<U>(name : string) : ModuleEntry<U> {
				var moduleEntry : ModuleEntry<U> = new ModuleEntry<U>(name);

				definitions.put( name, moduleEntry );

				return moduleEntry;
			}
		});
	}
}
