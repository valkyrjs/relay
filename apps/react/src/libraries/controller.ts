import type { ChangeEvent, Collection, SubscribeToMany, SubscribeToSingle, SubscriptionOptions } from "@valkyr/db";
import type { Subscription } from "@valkyr/event-emitter";

import { Debounce } from "./debounce.ts";
import { ControllerRefs } from "./refs.ts";
import type { ControllerClass, Empty, ReactComponent, ReservedPropertyMembers, Unknown } from "./types.ts";

export class Controller<TState extends Unknown = Empty, TProps extends Unknown = Empty> {
  state: TState = {} as TState;
  props: TProps = {} as TProps;

  /**
   * Stores a list of referenced elements identifies by a unique key.
   */
  readonly refs = new ControllerRefs();

  /**
   * Records of event emitter subscriptions. They are keyed to a subscription name
   * for easier identification when unsubscribing.
   */
  readonly subscriptions = new Map<string, Subscription>();

  /**
   * Has the controller fully resolved the .onInit lifecycle method?
   */
  #resolved = false;

  /**
   * Internal debounce instance used to ensure that we aren't triggering state
   * updates too frequently when updates are happening in quick succession.
   */
  #debounce = new Debounce();

  /**
   * Creates a new controller instance with given default state and pushState
   * handler method.
   *
   * @param state    - Default state to assign to controller.
   * @param pushData - Push data handler method.
   */
  constructor(
    readonly view: ReactComponent<TProps, any>,
    readonly setView: any,
  ) {
    this.query = this.query.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.setState = this.setState.bind(this);
  }

  /*
   |--------------------------------------------------------------------------------
   | Factories
   |--------------------------------------------------------------------------------
   */

  /**
   * Creates a new controller instance using the given component and setView handler.
   *
   * @param component - Component to render.
   * @param setView   - Method to provide a resolved view component.
   */
  static make<TController extends ControllerClass, TProps extends Unknown>(
    this: TController,
    component: ReactComponent<TProps, TController>,
    setView: any,
  ): InstanceType<TController> {
    return new this(component, setView);
  }

  /*
   |--------------------------------------------------------------------------------
   | Bootstrap & Teardown
   |--------------------------------------------------------------------------------
   */

  async $resolve(props: TProps): Promise<void> {
    this.props = props;
    let state: Partial<TState> = {};
    try {
      if (this.#resolved === false) {
        state = {
          ...state,
          ...((await this.onInit()) ?? {}),
        };
      }
      state = {
        ...state,
        ...((await this.onResolve()) ?? {}),
      };
    } catch (err) {
      console.error(err);
      throw err;
    }
    this.#resolved = true;
    this.setState(state);
  }

  async $destroy(): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    await this.onDestroy();
    this.refs.destroy();
  }

  /*
   |--------------------------------------------------------------------------------
   | Lifecycle Methods
   |--------------------------------------------------------------------------------
   */

  /**
   * Method runs once per controller view lifecycle. This is where you should
   * subscribe to and return initial controller state. A component is kept in
   * loading state until the initial resolve is completed.
   *
   * Once the initial resolve is completed the controller will not run the onInit
   * method again unless the controller is destroyed and re-created.
   *
   * @example
   * ```ts
   * async onInit() {
   *   return {
   *     foos: this.query(foos, {}, "foos")
   *   }
   * }
   * ```
   */
  async onInit(): Promise<Partial<TState> | void> {
    return {};
  }

  /**
   * Method runs every time the controller is resolved. This is where you should
   * subscribe to and return state that is reflecting changes to the parent view
   * properties.
   *
   * @example
   * ```ts
   * async onResolve() {
   *   return {
   *     foos: this.query(foos, { tenantId: this.props.tenantId }, "foos")
   *   }
   * }
   * ```
   */
  async onResolve(): Promise<Partial<TState> | void> {
    return {};
  }

  /**
   * Method runs when the controller parent view is destroyed.
   */
  async onDestroy(): Promise<void> {}

  /*
   |--------------------------------------------------------------------------------
   | Query Methods
   |--------------------------------------------------------------------------------
   */

  /**
   * Executes a query on a given collection and returns the initial result. A
   * subsequent internal subscription is also created, which automatically updates
   * the controller state when changes are made to the data in which the query
   * subscribes.
   *
   * @param collection - Collection to query against.
   * @param query      - Query to execute.
   * @param stateKey   - State key to assign the results to, or state handler method.
   *
   * @example
   * ```ts
   * async onInit() {
   *   return {
   *     foo: await this.query(db.collection("foos"), { limit: 1 }, "foo")
   *   }
   * }
   * ```
   */
  async query<TCollection extends Collection<any>, TSchema = CollectionSchema<TCollection>, TStateKey = keyof TState>(
    collection: TCollection,
    query: QuerySingle,
    next: TStateKey | ((document: TSchema | undefined) => Promise<Partial<TState>>),
  ): Promise<TSchema | undefined>;

  /**
   * Executes a query on a given collection and returns the initial result. A
   * subsequent internal subscription is also created, which automatically updates
   * the controller state when changes are made to the data in which the query
   * subscribes.
   *
   * @param collection - Collection to query against.
   * @param query      - Query to execute.
   * @param next       - State key to assign the results to, or state handler method.
   *
   * @example
   * ```ts
   * async onInit() {
   *   return {
   *     foos: await this.query(db.collection("foos"), {}, "foos")
   *   }
   * }
   * ```
   */
  async query<TCollection extends Collection<any>, TSchema = CollectionSchema<TCollection>, TStateKey = keyof TState>(
    collection: TCollection,
    query: QueryMany,
    next:
      | TStateKey
      | ((documents: TSchema[], changed: TSchema[], type: ChangeEvent["type"]) => Promise<Partial<TState>>),
  ): Promise<TSchema[]>;

  /**
   * Executes a query on a given collection and returns the initial result. A
   * subsequent internal subscription is also created, which automatically updates
   * the controller state when changes are made to the data in which the query
   * subscribes.
   *
   * @param collection - Collection to query against.
   * @param query      - Query to execute.
   * @param stateKey   - State key to assign the results to, or state handler method.
   */
  async query<TCollection extends Collection<any>, TSchema = CollectionSchema<TCollection>, TStateKey = keyof TState>(
    collection: TCollection,
    query: Query,
    next: TStateKey | ((...args: any[]) => Promise<Partial<TState>>),
  ): Promise<TSchema[] | TSchema | undefined> {
    let resolved = false;
    this.subscriptions.get(collection.name)?.unsubscribe();
    return new Promise<CollectionSchema<TCollection>[] | CollectionSchema<TCollection> | undefined>((resolve) => {
      const { where, ...options } = query;
      this.subscriptions.set(
        collection.name,
        collection.subscribe(where, options, (...args: any[]) => {
          if (this.#isStateKey(next)) {
            if (resolved === true) {
              this.setState(next, args[0]);
            }
          } else {
            (next as any)(...args).then(this.setState);
          }
          setTimeout(() => {
            resolve(args[0]);
            resolved = true;
          }, 0);
        }),
      );
    });
  }

  /*
   |--------------------------------------------------------------------------------
   | Event Methods
   |--------------------------------------------------------------------------------
   */

  /**
   * Consumes a subscription under a given event key that is unsubscribed
   * automatically when the controller is unmounted.
   *
   * @param key - Unique identifier used to unsusbcribe duplicate subs.
   * @param sub - Subscription to unsubscribe on controller unmount.
   */
  subscribe(key: string, sub: { unsubscribe: () => void }): void {
    this.subscriptions.get(key)?.unsubscribe();
    this.subscriptions.set(key, sub);
  }

  /*
   |--------------------------------------------------------------------------------
   | State Methods
   |--------------------------------------------------------------------------------
   */

  /**
   * Updates the state of the controller and triggers a state update via the push
   * state handler. This method will debounce state updates to prevent excessive
   * state updates.
   *
   * @param key   - State key to assign data to.
   * @param value - State value to assign.
   */
  setState(state: Partial<TState>): void;
  setState<K extends keyof TState>(key: K): (state: TState[K]) => void;
  setState<K extends keyof TState>(key: K, value: TState[K]): void;
  setState<K extends keyof TState>(...args: [K | TState, TState[K]?]): void | ((state: TState[K]) => void) {
    const [target, value] = args;

    if (this.#isStateKey(target) && args.length === 1) {
      return (value: TState[K]) => {
        this.setState(target, value);
      };
    }

    this.state = this.#isStateKey(target)
      ? {
          ...this.state,
          [target]: value,
        }
      : {
          ...this.state,
          ...(target as Partial<TState>),
        };

    if (this.#resolved === true) {
      this.#debounce.run(() => {
        this.setView(
          this.view({
            props: this.props,
            state: this.state,
            actions: this.toActions(),
            refs: this.refs,
          }),
        );
      }, 0);
    }
  }

  /*
   |--------------------------------------------------------------------------------
   | Resolvers
   |--------------------------------------------------------------------------------
   */

  /**
   * Returns all the prototype methods defined on the controller as a list of
   * actions bound to the controller instance to be used in the view.
   *
   * @returns List of actions.
   */
  toActions(): Omit<this, ReservedPropertyMembers> {
    const actions: any = {};
    for (const name of Object.getOwnPropertyNames(this.constructor.prototype)) {
      if (name !== "constructor" && name !== "resolve") {
        const action = (this as any)[name];
        if (typeof action === "function") {
          actions[name] = action.bind(this);
        }
      }
    }
    return actions;
  }

  /*
   |--------------------------------------------------------------------------------
   | Utilities
   |--------------------------------------------------------------------------------
   */

  #isStateKey(key: unknown): key is keyof TState {
    return typeof key === "string";
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type Query = Where & SubscriptionOptions;

type QuerySingle = Where & SubscribeToSingle;

type QueryMany = Where & SubscribeToMany;

type Where = {
  where?: Record<string, unknown>;
};

type CollectionSchema<TCollection extends Collection> = TCollection extends Collection<infer TSchema> ? TSchema : never;
