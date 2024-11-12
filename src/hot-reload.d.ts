declare namespace NodeJS {
  interface Module {
    hot: {
      accept(
        dependencies?: string | string[],
        callback?: (updatedDependencies?: string[]) => void,
      ): void;
      dispose(callback: (data: any) => void): void;
    };
  }
}

declare const module: NodeJS.Module;
