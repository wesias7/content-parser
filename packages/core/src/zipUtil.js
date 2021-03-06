import fs from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';

import createCryptoStream from './createCryptoStream';
import CryptoProvider from './CryptoProvider';
import { isExists, isString } from './typecheck';
import { safePathJoin } from './pathUtil';

function find(entryPath) {
  return this.files.find(entry => entryPath === entry.path);
}

async function getFile(entry, encoding) {
  let file = await new Promise((resolve, reject) => {
    const size = entry.uncompressedSize;
    let data = Buffer.from([]);
    entry.stream() // is DuplexStream.
      .pipe(createCryptoStream(entry.path, size, this.cryptoProvider, CryptoProvider.Purpose.READ_IN_ZIP))
      .on('data', (chunk) => { data = Buffer.concat([data, chunk]); })
      .on('error', e => reject(e))
      .on('end', () => resolve(data));
  });
  if (isExists(encoding)) {
    file = file.toString(encoding);
  }
  return file;
}

async function extractAll(unzipPath, overwrite = true) {
  if (overwrite) {
    fs.removeSync(unzipPath);
  }
  fs.mkdirpSync(unzipPath);

  const writeFile = (entry, output) => { // eslint-disable-line arrow-body-style
    return new Promise((resolve) => {
      const writeStream = fs.createWriteStream(output, { encoding: 'binary' });
      const onError = (error) => {
        resolve(error);
        writeStream.end();
      };
      writeStream.on('error', onError);
      writeStream.on('close', () => resolve());
      entry.stream() // is DuplexStream.
        .on('error', onError)
        .on('data', (chunk) => {
          if (isExists(this.cryptoProvider)) {
            chunk = this.cryptoProvider.run(chunk, entry.path, CryptoProvider.Purpose.WRITE);
          }
          writeStream.write(chunk);
        })
        .on('finish', () => writeStream.end());
    });
  };

  await this.files.reduce((prevPromise, entry) => { // eslint-disable-line arrow-body-style
    return prevPromise.then(async () => {
      const output = safePathJoin(unzipPath, entry.path);
      if (entry.path.split('/').length > 1) {
        const dir = path.dirname(output);
        if (!fs.existsSync(dir)) {
          fs.mkdirpSync(dir);
        }
      }
      if (!entry.path.endsWith('/')) {
        const error = await writeFile(entry, output);
        if (error) {
          this.logger.error(error);
        }
      }
    });
  }, Promise.resolve());
}

export default async function openZip(file, cryptoProvider, logger) {
  let open = unzipper.Open.file;
  if (!isString(file)) {
    open = unzipper.Open.buffer;
  }
  const zip = await open(file);
  zip.cryptoProvider = cryptoProvider;
  return {
    ...zip,
    find,
    getFile,
    extractAll,
    logger,
  };
}
