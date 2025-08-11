import { deepEqual } from "fast-equals";
import React, { createElement, type FunctionComponent, memo, type PropsWithChildren, useEffect, useState } from "react";

import type { ControllerClass, ReactComponent, Unknown } from "./types.ts";

/*
 |--------------------------------------------------------------------------------
 | Options
 |--------------------------------------------------------------------------------
 */

const options: Partial<ViewOptions<any>> = {
  memoize: defaultMemoizeHandler,
};

/*
 |--------------------------------------------------------------------------------
 | Factory
 |--------------------------------------------------------------------------------
 */

export function makeControllerView<TController extends ControllerClass, TProps extends Unknown>(
  controller: TController,
  component: ReactComponent<TProps, TController>,
  options?: Partial<ViewOptions<TProps>>,
): FunctionComponent<TProps> {
  const memoize = getMemoizeHandler(options?.memoize);
  const render = {
    loading: getLoadingComponent<TProps>(options),
    error: getErrorComponent<TProps>(options),
  };

  const container: FunctionComponent<PropsWithChildren<TProps>> = (props: any) => {
    const { error, view } = useView<TProps, TController>(controller, component, props);
    if (view === undefined) {
      return render.loading(props);
    }
    if (error !== undefined) {
      return render.error({ ...props, error });
    }
    return view;
  };

  container.displayName = component.displayName = options?.name ?? `${controller.name}View`;

  // ### Memoize
  // By default run component through react memoization using stringify
  // matching to determine changes to props.

  if (memoize !== false) {
    return memo(container, memoize);
  }

  return container;
}

/*
 |--------------------------------------------------------------------------------
 | Hooks
 |--------------------------------------------------------------------------------
 */

function useView<Props extends Unknown, Controller extends ControllerClass>(
  instance: InstanceType<ControllerClass> | undefined,
  component: ReactComponent<Props, Controller>,
  props: any,
) {
  const [view, setView] = useState();

  const error = useController(instance, component, props, setView);

  return { error, view };
}

function useController(controller: ControllerClass, component: any, props: any, setView: any) {
  const [instance, setInstance] = useState<InstanceType<ControllerClass> | undefined>(undefined);
  const error = useProps(instance, props);

  useEffect(() => {
    const instance = controller.make(component, setView);
    setInstance(instance);
    return () => {
      instance.$destroy();
    };
  }, []);

  return error;
}

function useProps(controller: InstanceType<ControllerClass> | undefined, props: any) {
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    if (controller === undefined) {
      return;
    }
    let isMounted = true;
    controller.$resolve(props).catch((error: Error) => {
      if (isMounted === true) {
        setError(error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [controller, props]);

  return error;
}

/*
 |--------------------------------------------------------------------------------
 | Components
 |--------------------------------------------------------------------------------
 */

export function setLoadingComponent(component: React.FC) {
  options.loading = component;
}

function getLoadingComponent<TProps extends Unknown>({ loading }: Partial<ViewOptions<any>> = {}) {
  const component = loading ?? options.loading;
  if (component === undefined) {
    return () => null;
  }
  return (props: TProps) => createElement(component, props);
}

export function setErrorComponent(component: React.FC) {
  options.error = component;
}

function getErrorComponent<TProps extends Unknown>({ error }: Partial<ViewOptions<any>> = {}) {
  const component = error ?? options.loading;
  if (component === undefined) {
    return () => null;
  }
  return (props: TProps) => createElement(component, props);
}

/*
 |--------------------------------------------------------------------------------
 | Memoize
 |--------------------------------------------------------------------------------
 */

export function setMemoizeHandler(value: boolean | Memoize<any>) {
  if (typeof value === "function") {
    options.memoize = value;
  } else if (value === false) {
    options.memoize = false;
  } else {
    options.memoize = defaultMemoizeHandler;
  }
}

function getMemoizeHandler(memoize?: ViewOptions<any>["memoize"]): false | Memoize<any> | undefined {
  if (typeof memoize === "function") {
    return memoize;
  }
  if (memoize !== false) {
    return options.memoize;
  }
  return false;
}

/*
 |--------------------------------------------------------------------------------
 | Defaults
 |--------------------------------------------------------------------------------
 */

function defaultMemoizeHandler(prev: any, next: any): boolean {
  if (prev.children !== undefined && next.children !== undefined) {
    if (prev.children.type.type.displayName !== next.children.type.type.displayName) {
      return false;
    }
  }
  return deepEqual(prev, next);
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

export type ViewOptions<Props> = {
  name?: string;
  loading: React.FC<Props>;
  error: React.FC<Props & { error: Error }>;
  memoize: false | Memoize<Props>;
};

type Memoize<Props> = (prevProps: Readonly<Props>, nextProps: Readonly<Props>) => boolean;

type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
