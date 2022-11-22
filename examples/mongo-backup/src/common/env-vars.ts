
export namespace EnvVars {

  export function readString(
    name: string

  ): (string | undefined) {

    return readVar(name);

  }

  export function requireString(name: string): string {
    return requireDefined(name, readString(name))!;
  }

  export function readStringList(
    name: string,
    separator = ','

  ): (string[] | undefined) {

    const strList = readVar(name);
    if (!strList) {
      return undefined;
    }

    return (strList
      .split(separator)
      .map(value => value.trim())
      .filter(Boolean)
    );

  }

  export function requireStringList(name: string): string[] {
    return requireDefined(name, readStringList(name))!;
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

}
