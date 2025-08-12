import z, { type ZodObject, type ZodRawShape } from "zod";

export class Form<TSchema extends ZodRawShape, TInputs = z.infer<ZodObject<TSchema>>> {
  readonly schema: ZodObject<TSchema>;

  readonly inputs: Partial<TInputs> = {};

  #debounce: FormDebounce<TInputs> = {
    validate: {},
  };

  #defaults: Partial<TInputs>;
  #errors: FormErrors<TInputs> = {};
  #elements: Record<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = {};

  #onChange?: OnChangeCallback<TInputs>;
  #onProcessing?: OnProcessingCallback;
  #onError?: OnErrorCallback<TInputs>;
  #onSubmit?: OnSubmitCallback<TInputs>;
  #onResponse?: OnResponseCallback<any, any>;

  /*
   |--------------------------------------------------------------------------------
   | Constructor
   |--------------------------------------------------------------------------------
   */

  constructor(schema: TSchema, defaults: Partial<TInputs> = {}) {
    this.schema = z.object(schema);
    this.#defaults = defaults;
    this.#bindMethods();
    this.#setDefaults();
    this.#setSubmit();
  }

  #bindMethods() {
    this.register = this.register.bind(this);
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.validate = this.validate.bind(this);
    this.submit = this.submit.bind(this);
  }

  #setDefaults() {
    for (const key in this.#defaults) {
      this.inputs[key] = this.#defaults[key] ?? ("" as any);
    }
  }

  #setSubmit() {
    if ((this.constructor as any).submit !== undefined) {
      this.onSubmit((this.constructor as any).submit);
    }
  }

  /*
   |--------------------------------------------------------------------------------
   | Accessors
   |--------------------------------------------------------------------------------
   */

  get isValid(): boolean {
    return Object.keys(this.#getFormErrors()).length === 0;
  }

  get hasError() {
    return Object.keys(this.errors).length !== 0;
  }

  get errors(): FormErrors<TInputs> {
    return this.#errors;
  }

  set errors(value: FormErrors<TInputs>) {
    this.#errors = value;
    this.#onError?.(value);
  }

  /**
   * Register a input element with the form. This registers form related methods and a
   * reference to the element itself that can be utilized by the form.
   *
   * @param name - Name of the input field.
   */
  register<TKey extends keyof TInputs>(name: TKey) {
    return {
      name,
      ref: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
        if (element !== null) {
          this.#elements[name as string] = element;
        }
      },
      defaultValue: this.get(name),
      onChange: ({ target: { value } }: any) => {
        this.set(name, value);
      },
    };
  }

  /*
   |--------------------------------------------------------------------------------
   | Registrars
   |--------------------------------------------------------------------------------
   */

  onChange(callback: OnChangeCallback<TInputs>): this {
    this.#onChange = callback;
    return this;
  }

  onProcessing(callback: OnProcessingCallback): this {
    this.#onProcessing = callback;
    return this;
  }

  onError(callback: OnErrorCallback<TInputs>): this {
    this.#onError = callback;
    return this;
  }

  onSubmit(callback: OnSubmitCallback<TInputs>): this {
    this.#onSubmit = callback;
    return this;
  }

  onResponse<E, R>(callback: OnResponseCallback<E, R>): this {
    this.#onResponse = callback;
    return this;
  }

  /*
   |--------------------------------------------------------------------------------
   | Data
   |--------------------------------------------------------------------------------
   */

  /**
   * Set the value of an input field.
   *
   * @param name  - Name of the input field.
   * @param value - Value to set.
   */
  set<TKey extends keyof TInputs>(name: TKey, value: TInputs[TKey]): void {
    this.inputs[name] = value;
    this.#onChange?.(name, value);
    clearTimeout(this.#debounce.validate[name]);
    this.#debounce.validate[name] = setTimeout(() => {
      this.validate(name);
    }, 200);
  }

  /**
   * Get the current input values or a specific input value.
   *
   * @param name - Name of the input field. _(Optional)_
   */
  get(): Partial<TInputs>;
  get<TKey extends keyof TInputs>(name: TKey): TInputs[TKey] | undefined;
  get<TKey extends keyof TInputs>(name?: TKey): Partial<TInputs> | TInputs[TKey] | undefined {
    if (name === undefined) {
      return { ...this.inputs };
    }
    return this.inputs[name];
  }

  /**
   * Reset form back to its default values.
   */
  reset() {
    for (const key in this.inputs) {
      const value = this.#defaults[key] ?? "";
      (this.inputs as any)[key] = value;
      if (this.#elements[key] !== undefined) {
        (this.#elements as any)[key].value = value;
      }
    }
  }

  /*
   |--------------------------------------------------------------------------------
   | Submission
   |--------------------------------------------------------------------------------
   */

  async submit(event: any) {
    event.preventDefault?.();
    this.#onProcessing?.(true);
    this.validate();
    if (this.hasError === false) {
      try {
        const response = await this.#onSubmit?.(this.schema.parse(this.inputs) as TInputs);
        this.#onResponse?.(undefined, response);
      } catch (error) {
        this.#onResponse?.(error, undefined as any);
      }
    }
    this.#onProcessing?.(false);
    this.reset();
  }

  validate(name?: keyof TInputs) {
    if (name !== undefined) {
      this.#validateInput(name);
    } else {
      this.#validateForm();
    }
  }

  #validateForm(): void {
    this.errors = this.#getFormErrors();
  }

  #validateInput(name: keyof TInputs): void {
    const errors = this.#getFormErrors();
    let hasChanges = false;
    if (errors[name] === undefined && this.errors[name] !== undefined) {
      delete this.errors[name];
      hasChanges = true;
    }
    if (errors[name] !== undefined && this.errors[name] !== errors[name]) {
      this.errors[name] = errors[name];
      hasChanges = true;
    }
    if (hasChanges === true) {
      this.#onError?.({ ...this.errors });
    }
  }

  #getFormErrors(): FormErrors<TInputs> {
    const result = this.schema.safeParse(this.inputs);
    if (result.success === false) {
      throw result.error.flatten;
      // return result.error.details.reduce<Partial<TInputs>>(
      //   (error, next) => ({
      //     ...error,
      //     [next.path[0]]: next.message,
      //   }),
      //   {},
      // );
    }
    return {};
  }
}

/*
 |--------------------------------------------------------------------------------
 | Types
 |--------------------------------------------------------------------------------
 */

type OnChangeCallback<TInputs, TKey extends keyof TInputs = keyof TInputs> = (name: TKey, value: TInputs[TKey]) => void;

type OnProcessingCallback = (value: boolean) => void;

type OnErrorCallback<TInputs> = (errors: FormErrors<TInputs>) => void;

type OnSubmitCallback<TInputs> = (inputs: TInputs) => Promise<any>;

type OnResponseCallback<Error, Response> = (err: Error, res: Response) => void;

type FormDebounce<TInputs> = {
  validate: {
    [TKey in keyof TInputs]?: any;
  };
};

type FormErrors<TInputs> = {
  [TKey in keyof TInputs]?: string;
};
