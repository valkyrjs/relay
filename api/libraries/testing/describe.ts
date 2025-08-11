import * as assertSuite from "@std/assert";
import * as bddSuite from "@std/testing/bdd";

import type { TestContainer } from "~libraries/testing/containers/test-container.ts";

import { authorize } from "./utilities/account.ts";

export function describe(name: string, runner: TestRunner): (container: TestContainer) => void {
  return (container: TestContainer) =>
    bddSuite.describe(name, () => runner(container, bddSuite, assertSuite, { authorize: authorize(container) }));
}

export type TestRunner = (
  container: TestContainer,
  bdd: {
    [key in keyof typeof bddSuite]: (typeof bddSuite)[key];
  },
  assert: {
    [key in keyof typeof assertSuite]: (typeof assertSuite)[key];
  },
  utils: {
    authorize: ReturnType<typeof authorize>;
  },
) => void;
