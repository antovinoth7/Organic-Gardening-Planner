export interface Migration {
  version: number;
  name: string;
  run: (userId: string) => Promise<void>;
}
