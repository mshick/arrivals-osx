import * as fs from 'fs';
import * as path from 'path';
import run from '../src';

beforeEach(() => {
  // noop
});

afterEach(() => {
  // noop
});

describe('arrivals-osx', () => {
  it('does something', async () => {
    await expect(run()).resolves.not.toThrow();
  });
});
