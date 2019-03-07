import leveldown from 'leveldown';
import levelup, { LevelUp } from 'levelup';
import { CreateDbOptions } from './typings';

export function createDb(options: CreateDbOptions): LevelUp {
  return levelup(leveldown(options.dbPath));
}
