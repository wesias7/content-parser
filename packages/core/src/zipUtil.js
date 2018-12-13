import fs from 'fs-extra';
import path from 'path';
import unzipper from 'unzipper';

import Logger from './Logger';
import { isExists, isString } from './typecheck';
import { safePathJoin } from './pathUtil';

function find(entryPath) {
  return this.files.find(entry => entryPath === entry.path);
}

async function getFile(entry, encoding) {
  let file = await new Promise((resolve, reject) => {
    let buffer = Buffer.from([]);
    entry.stream()
      .on('data', (chunk) => {
        if (isExists(this.cryptoProvider)) {
          buffer = Buffer.concat([buffer, this.cryptoProvider.run(chunk, entry.path)]);
        } else {
          buffer = Buffer.concat([buffer, chunk]);
        }
      })
      .on('error', e => {
        Logger.error(e);
        reject(e);
      })
      .on('finish', () => resolve(buffer));
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
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(output);
      const onError = (e) => {
        Logger.error(e);
        reject(e);
        writeStream.close();
      };
      entry.stream()
        .on('data', (chunk) => {
          if (isExists(this.cryptoProvider)) {
            writeStream.write(this.cryptoProvider.run(chunk, entry.path));
          } else {
            writeStream.write(chunk);
          }
        })
        .on('error', onError)
        .on('finish', () => writeStream.close());
      writeStream.on('error', onError);
      writeStream.on('close', () => resolve());
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
      await writeFile(entry, output);
    });
  }, Promise.resolve());
}

export default async function openZip(file, cryptoProvider) {
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
  };
}
