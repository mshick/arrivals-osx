import fs from 'fs';
import { prompt, Question } from 'inquirer';
import { execPromise, expandPath, untildify } from './utils';

export interface InquireAnswers {
  readonly ATOMICPARSLEY_PATH: string;
  readonly FFMPEG_PATH: string;
  readonly FFPROBE_PATH: string;
  readonly WATCH_PATHS: string;
  readonly VIDEO_DESTINATION: string;
  readonly AUDIO_DESTINATION: string;
  readonly AUDIO_CONVERT_EXTENSIONS: string;
  readonly AUDIO_COPY_EXTENSIONS: string;
  readonly VIDEO_COPY_EXTENSIONS: string;
  readonly DB_PATH: string;
  readonly LOG_LEVEL: string;
  readonly TMP_PATH: string;
}

export async function inquire(): Promise<any> {
  const processCwd = process.cwd();
  const homeDir = untildify('~/');
  const baseDir = '.arrivals';
  const { stdout: atomicparsley } = await execPromise('which atomicparsley');
  const { stdout: ffmpeg } = await execPromise('which ffmpeg');
  const { stdout: ffprobe } = await execPromise('which ffprobe');

  const expandOptions = {
    baseDir,
    defaultValue: '',
    homeDir,
    processCwd
  };

  const questions: Question[] = [
    {
      filter: (answer: string) =>
        answer
          .trim()
          .split(',')
          .map(p => expandPath(p, expandOptions))
          .join(','),
      message: 'Enter paths to watch, separated by a comma:',
      name: 'WATCH_PATHS',
      type: 'input',
      validate: (answer: string) =>
        answer.length > 0 &&
        answer
          .split(',')
          .map(p => fs.existsSync(p))
          .filter(x => x).length > 0
    },
    {
      filter: (answer: string) => expandPath(answer.trim(), expandOptions),
      message: 'Video destination path:',
      name: 'VIDEO_DESTINATION',
      type: 'input',
      validate: (answer: string) => answer.length > 0 && fs.existsSync(answer)
    },
    {
      filter: (answer: string) => expandPath(answer.trim(), expandOptions),
      message: 'Audio destination path:',
      name: 'AUDIO_DESTINATION',
      type: 'input',
      validate: (answer: string) => answer.length > 0 && fs.existsSync(answer)
    },
    {
      default: 'flac',
      filter: (answer: string) => answer.trim(),
      message: 'Convert audio extensions:',
      name: 'AUDIO_CONVERT_EXTENSIONS',
      type: 'input'
    },
    {
      default: 'mp3,m4a,m4b',
      filter: (answer: string) => answer.trim(),
      message: 'Copy audio extensions:',
      name: 'AUDIO_COPY_EXTENSIONS',
      type: 'input'
    },
    {
      default: 'mkv',
      filter: (answer: string) => answer.trim(),
      message: 'Copy video extensions:',
      name: 'VIDEO_COPY_EXTENSIONS',
      type: 'input'
    },
    {
      default: atomicparsley.trim(),
      filter: (answer: string) => answer.trim(),
      message: 'AtomicParsley path:',
      name: 'ATOMICPARSLEY_PATH',
      type: 'input',
      validate: (answer: string) => answer.length > 0
    },
    {
      default: ffmpeg.trim(),
      filter: (answer: string) => answer.trim(),
      message: 'Ffmpeg path:',
      name: 'FFMPEG_PATH',
      type: 'input',
      validate: (answer: string) => answer.length > 0
    },
    {
      default: ffprobe.trim(),
      filter: (answer: string) => answer.trim(),
      message: 'Ffprobe path:',
      name: 'FFPROBE_PATH',
      type: 'input',
      validate: (answer: string) => answer.length > 0
    },
    {
      default: expandPath('', { ...expandOptions, defaultValue: 'db' }),
      filter: (answer: string) => expandPath(answer.trim(), expandOptions),
      message: 'Database path:',
      name: 'DB_PATH',
      type: 'input',
      validate: (answer: string) => answer.length > 0
    },
    {
      // @ts-ignore
      choices: [
        { name: 'info', value: 'info' },
        { name: 'error', value: 'error' },
        { name: 'debug', value: 'debug' }
      ],
      message: 'Log file path (not ):',
      name: 'LOG_LEVEL',
      type: 'list'
    },
    {
      default: '/tmp',
      filter: (answer: string) => expandPath(answer.trim(), expandOptions),
      message: 'Temp path:',
      name: 'TMP_PATH',
      type: 'input',
      validate: (answer: string) => answer.length > 0
    }
  ];

  return prompt(questions).then(answers => {
    return answers as InquireAnswers;
  });
}
