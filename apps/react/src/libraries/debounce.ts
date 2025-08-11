export class Debounce {
  #timeout?: number;

  run(fn: (...args: any[]) => void, ms: number): void {
    this.#clear();
    this.#timeout = setTimeout(fn, ms);
  }

  #clear() {
    if (this.#timeout !== undefined) {
      clearTimeout(this.#timeout);
    }
  }
}
