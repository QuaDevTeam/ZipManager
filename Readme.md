# @quajs/zip-manager

Manage zip assets in browser.

## Usage

Step 1: Install this package.

```bash
$ npm i @quajs/zip-manager
```

Step 2: Import this package to your project.

```ts
import ZipManager from '@quajs/zip-manager';

const manager = new ZipManager('assets');

manager.load('https://somewhere/assets.zip');
```

## License

Apache 2.0
