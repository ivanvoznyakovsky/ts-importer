### TS Importer

Automatically searches for TypeScript definitions in workspace files and provides all known symbols as completion item to allow code completion.

If a TypeScripts ^1.9.0 `paths.*` mapping is set in the tsconfig.json, the imports are tried to be resolved absolutly. 
Otherwise the imports are resolved relative to the current file.  

The current supported symbols are:

>       export class [name] { ... }
>       export abstract class [name] { ... }
>       export interface [name] { ... }
>       export type [name] =  { ... },
>       export const [name] = ...
>       export var [name] = ...
>       export let [name] = ...
>       export function [name] = ...
>       export enum [name] = ...
>       export default ...

----

<img src="http://g.recordit.co/QHByAo9Km7.gif">

----

## Configuration

> tsimporter.filesToScan - Glob for which files in your workspace to scan, defaults to `['**/*.ts','**/*.tsx']`

> tsimporter.filesToExclude - Glob for files to exclude from watch and scan, e.g `./out/**`. Defaults to nothing

> tsimporter.showNotifications - Show status notifications, default is false

> tsimporter.doubleQuotes - Use double quotes rather than single

> tsimporter.spaceBetweenBraces - Insert spaces between the import braces. ( `import {test} from 'test' vs. import { test } from 'test'` )

> tsimporter.disabled - Disables the extension

> tsimporter.removeFileExtensions - File Extensions to remove. default is `'.d.ts,.ts,.tsx'`

> tsimporter.lowImportance - If true, the code completion items will be sorted back to the build in completion items. default is false

> tsimporter.emitSemicolon - If false, no semicolon will be written. default is true

----


## Changelog

### 1.2.5
- New Param `emitSemicolon`

### 1.2.4
- New Param `lowImportance`

### 1.2.3
- BUGFIX: Support of filenames including dots

### 1.2.2
- Add support of tsx files

### 1.2.1
- Updated to vscode 1.5.3

### 1.2.0
- Add support of `* as Symbol` syntax
- Add support of `export default` syntax

### 1.1.0
- BUGFIX: support of vscode 1.5.2
- Changed filesToScan to an array and added filesToExclude glob patterns
- Automatically add the import for the selected code completion item
- Filtering known symbols from code completion items 

### 1.0.1
- BUGFIX: respecting the tsimporter.doubleQuotes setting
- Processing of `export function` and `export enum`

### 1.0.0
- First Version


## ToDo
- Follow up `///<reference path="..." />` declarations
- Process `node_modules/**/*.d.ts`
- Process `typings/**/*.d.ts`


