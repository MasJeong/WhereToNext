declare global {
  interface ReadonlyArray<T> {
    includes(searchElement: T extends number ? number : T, fromIndex?: number): boolean;
  }

  interface Array<T> {
    includes(searchElement: T extends number ? number : T, fromIndex?: number): boolean;
  }
}

export {};
