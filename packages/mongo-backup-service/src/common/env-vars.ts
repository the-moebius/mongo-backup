
export namespace EnvVars {

  const envPrefix = '$ENV:';

  export function readString(
    name: string

  ): (string | undefined) {

    return readVar(name);

  }

  export function requireString(name: string): string {
    return requireDefined(name, readString(name))!;
  }

  function readVar(name: string): (string | undefined) {
    return (process.env[name] || '').trim() || undefined;
  }

  function requireDefined<Type>(
    name: string,
    value: Type

  ): Type {

    if (!value) {
      throw new Error(
        `Missing required environment variable: ${name}`
      );
    }

    return value;

  }

  export function resolveValue(value: string): string {

    if (value.startsWith(envPrefix)) {
      const varName = value.substring(envPrefix.length);
      return requireString(varName);

    } else {
      return value;

    }

  }

}
