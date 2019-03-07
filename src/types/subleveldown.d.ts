declare module 'subleveldown' {
  import { LevelUp } from 'levelup';

  export interface SublevelOptions {
    valueEncoding?: string;
  }

  export default function subleveldown(
    levelDb: LevelUp,
    sublevelName: string,
    sublevelOptions: SublevelOptions
  ): LevelUp;
}
