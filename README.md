## Functions

<dl>
<dt><a href="#deepScanDir">deepScanDir(directory, [exclude], [only], [filter])</a> ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code></dt>
<dd><p>Deep scans the given <code>directory</code> returning an array with strings to all of the files found in that <code>directory</code>.</p>
</dd>
<dt><a href="#extendConfig">extendConfig(scope, replacement)</a></dt>
<dd><p>Extends a configuration scope</p>
</dd>
<dt><a href="#mergeConfigWithEnv">mergeConfigWithEnv(config, prefix)</a> ⇒ <code>*</code></dt>
<dd><p>Replaces <code>config</code> properties with given ENV variables. Mutates given <code>config</code>.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#MDRawParserPlugin">MDRawParserPlugin</a> ⇒ <code>String</code></dt>
<dd><p>Transforms given <code>content</code></p>
</dd>
</dl>

<a name="deepScanDir"></a>

## deepScanDir(directory, [exclude], [only], [filter]) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Deep scans the given `directory` returning an array with strings to all of the files found in that `directory`.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - Paths found  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| directory | <code>String</code> |  | The directory to scan |
| [exclude] | <code>Array.&lt;String&gt;</code> \| <code>Array.&lt;RegExp&gt;</code> | <code>[/node_modules/]</code> | Paths to exclude |
| [only] | <code>Array.&lt;String&gt;</code> \| <code>Array.&lt;RegExp&gt;</code> | <code>[]</code> | If present, only paths matching the at least one of the expressions, would be included. |
| [filter] | <code>function</code> |  | Callback function called with the evaluated `path` as the first argument. Must return `true` or `false` |

<a name="extendConfig"></a>

## extendConfig(scope, replacement)
Extends a configuration scope

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| scope | <code>String</code> | Scope to extend |
| replacement | <code>function</code> \| <code>Object</code> | Either an object to merge with the local configuration, or a function that will get called per configuration request and must return an object to merge with local found scope. |

**Example** *(Overriding a scope)*  

```js
// forces to assign 4000 as the value of port in the api scopes
extendConfig('api', { port: 4000 })

// will return { api: { port: 4000, xxx: 'xValue', yyy: 'yValue' }, ui { ... } }
getConfig()
```
<a name="mergeConfigWithEnv"></a>

## mergeConfigWithEnv(config, prefix) ⇒ <code>\*</code>
Replaces `config` properties with given ENV variables. Mutates given `config`.

**Kind**: global function  
**Returns**: <code>\*</code> - The mutated object  
**Examples**: ```js
process.env.PLEASURE_API_MONGODB_HOST = '127.0.0.1'
mergeConfigWithEnv({
  api: {
    mongodb: {
      host: 'localhost',
      collection: 'my-project'
    }
  }
})

// api: {
//   mongodb: {
//     host: '127.0.0.1',
//     collection: 'my-project'
//   }
// }
```  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| config | <code>Object</code> |  | The configuration object |
| prefix | <code>String</code> | <code>PLEASURE</code> | Prefix of the ENV variable |

<a name="MDRawParserPlugin"></a>

## MDRawParserPlugin ⇒ <code>String</code>
Transforms given `content`

**Kind**: global typedef  
**Returns**: <code>String</code> - - New transformed source  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Plugin options |
| opts.subModule | <code>Boolean</code> | Whether the plugin is being called through the main pipeline or being re-called by another plugin |
| mainOut | <code>String</code> | Bundle destination |
| directory | <code>String</code> | - |
| parentDir | <code>String</code> | `directory` to the file importing `src` |
| src | <code>String</code> | Path to the file where the `content` was loaded |
| content | <code>String</code> | The content of `src` |


* * *

&copy; 2019 Martin Rafael Gonzalez
