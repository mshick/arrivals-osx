export function prettyPrint(data: object): string {
  return JSON.stringify(data, null, 4);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
