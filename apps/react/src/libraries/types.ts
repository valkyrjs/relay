import React, { type FunctionComponent } from "react";

import { ControllerRefs } from "./refs.ts";

export type ReactComponent<TProps extends Unknown, TController extends ControllerClass> = FunctionComponent<{
  props: TProps;
  state: InstanceType<TController>["state"];
  actions: Omit<InstanceType<TController>, ReservedPropertyMembers>;
  refs: ControllerRefs;
  component?: React.FC;
}>;

export type ControllerClass = {
  new (state: any, pushState: any): any;
  make(component: ReactComponent<any, any>, pushState: any): any;
};

export type ReservedPropertyMembers = "state" | "pushState" | "init" | "destroy" | "setNext" | "setState" | "toActions";

export type Unknown = Record<string, unknown>;

export type Empty = Record<string, never>;
