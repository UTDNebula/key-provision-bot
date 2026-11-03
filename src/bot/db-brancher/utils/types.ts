export type OnlyOneRequired<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  } & {
    [P in Exclude<keyof T, K>]?: undefined;
  };
}[keyof T];
