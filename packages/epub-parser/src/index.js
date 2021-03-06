import {
  CryptoProvider, Cryptor,
  Errors,
  LogLevel,
} from '@ridi/parser-core';

import EpubParser from './EpubParser';
import Book from './model/Book';

export default {
  EpubParser,
  Errors,
  LogLevel,
  CryptoProvider,
  Cryptor,
  EpubBook: Book,
};
