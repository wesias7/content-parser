# @ridi/comic-parser

> Common comic data parser for Ridibooks services

[![NPM version](https://badge.fury.io/js/%40ridi%2Fcomic-parser.svg)](https://badge.fury.io/js/%40ridi%2Fcomic-parser)
[![Build Status](https://travis-ci.org/ridi/content-parser.svg?branch=master)](https://travis-ci.org/ridi/content-parser)
[![codecov](https://codecov.io/gh/ridi/content-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/ridi/content-parser)
[![NPM total downloads](https://img.shields.io/npm/dt/%40ridi%2Fcomic-parser.svg)](https://npm.im/%40ridi%2Fcomic-parser)

## Features

- [x] Single structure parsing
- [ ] Nested structure parsing
- [x] Unzip zip file when parsing with options
- [x] Read files
  - [x] Read image in base64 encoding
- [x] Encrypt and decrypt function when parsing or reading or unzipping
- [ ] Debug mode
- [ ] Environment
  - [x] Node
  - [ ] CLI
  - [ ] Browser
- [ ] Online demo

## Install

```bash
npm install @ridi/comic-parser
```

## Usage

Basic:

```js
import { ComicParser } from '@ridi/comic-parser';
// or const { ComicParser } = require('@ridi/comic-parser');

const parser = new ComicParser('./foo/bar.zip' or './unzippedPath');
parser.parse(/* { parseOptions } */).then((items) => {
  parser.readItems(items/*, { readOptions } */).then((results) => {
    ...
  });
  ...
});
```

with [Cryptor](https://github.com/ridi/content-parser/blob/master/src/cryptor/Cryptor.js):

```js
import { CryptoProvider, Cryptor } from '@ridi/comic-parser';
// or const { CryptoProvider, Cryptor } = require('@ridi/comic-parser');

const { Purpose } = CryptoProvider;
const { Modes, Padding } = Cryptor;

class ContentCryptoProvider extends CryptoProvider {
  constructor(key) {
    super();
    this.cryptor = new Cryptor(Modes.ECB, { key });
  }

  getCryptor(filePath, purpose) {
    return this.cryptor;
  }

  // If use as follows:
  // const provider = new ContentCryptoProvider(...);
  // const parser = new ComicParser('encrypted.zip', provider);
  // const book = await parser.parse({ unzipPath: ... });
  // const firstImage = await parser.readItem(book.items[0]);
  //
  // It will be called as follows:
  // 1. run(data, 'encrypted.zip', Purpose.READ_IN_DIR)
  // 2. run(data, '0001.jpg', Purpose.READ_IN_ZIP)
  // ...
  // 4. run(data, '0001.jpg', Purpose.WRITE)
  // ...
  // 5. run(data, '0001.jpg', Purpose.READ_IN_DIR)
  //
  run(data, filePath, purpose) {
    const cryptor = this.getCryptor(filePath, purpose);
    const padding = Padding.AUTO;
    if (purpose === Purpose.READ_IN_DIR) {
      return cryptor.decrypt(data, padding);
    } else if (purpose === Purpose.WRITE) {
      return cryptor.encrypt(data, padding);
    }
    return data;
  }
}

const cryptoProvider = new ContentCryptoProvider(key);
const parser = new ComicParser('./encrypted.zip' or './unzippedPath', cryptoProvider);
```

Log level setting:

```js
import { LogLevel, ... } from '@ridi/comic-parser';
parser.logger.logLevel = LogLevel.VERBOSE; // SILENT, ERROR(default), WARNING, INFO, VERBOSE
```

## API

### parse(parseOptions)

Returns `Promise<ComicBook>` with:

- [ComicBook](#book): Instance with image path, size, etc.

Or throw exception.

#### [parseOptions](#parseOptions): `?object`

---

### readItem(item, readOptions)

Returns `string` or `Buffer` in `Promise` with:

- If `readOptions.base64` is `true`:

  - `string`

- Other:

  - `Buffer`

or throw exception.

#### item: [Item](#item)

#### [readOptions](#readOptions): `?object`

---

### readItems(items, readOptions)

Returns `string[]` or `Buffer[]` in `Promise` with:

- If `readOptions.base64` is `true`:

  - `string`

- Other:

  - `Buffer`

or throw exception.

#### items: [Item\[\]](#item)

#### [readOptions](#readOptions): `?object`

---

### onProgress = callback(step, totalStep, action)

Tells the progress of parser through `callback`.

```js
const { Action } = ComicParser; // PARSE, READ_ITEMS
parser.onProgress = (step, totalStep, action) => {
  console.log(`[${action}] ${step} / ${totalStep}`);
}
```

## Model

<a id="book"></a>

### [ComicBook](./src/model/Book.js)

- items: *[Item](#item)[]*

<a id="item"></a>

### [Item](./src/model/Item.js)

- index: *?string*
- path: *?string*
- size: *?number*

<a id="parseOptions"></a>

## Parse Options

* [unzipPath](#unzipPath)
* [overwrite](#overwrite)
* [ext](#ext)

---

<a id="unzipPath"></a>

### unzipPath: *`?string`*

If specified, unzip to that path.
> only using if input is Zip file.

**Default:** `undefined`

---

<a id="overwrite"></a>

### overwrite: *`boolean`*

If true, overwrite to [unzipPath](#unzipPath) when unzip.
> only using if unzipPath specified.

**Default:** `true`

---

<a id="ext"></a>

### ext: *`string[]`*

File extension to allow when extracting lists.

**Default:** `['jpg', 'jpeg', 'png', 'bmp', 'gif']`

<a id="readOptions"></a>

## Read Options

* [force](#force)
* [base64](#base64)

---

<a id="force"></a>

### force: *boolean*

If true, ignore any exceptions that occur within parser.

**Default:** `false`

---

<a id="base64"></a>

### base64: *`boolean`*

If false, reads image into a buffer.

**Default:** `false`

## License

[MIT](https://github.com/ridi/content-parser/blob/master/LICENSE)
