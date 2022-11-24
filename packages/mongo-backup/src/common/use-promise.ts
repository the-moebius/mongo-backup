
export type Handler<Type> = (arg: Type) => void;

export interface PromiseController<Type> {
  promise: Promise<Type>;
  resolve: Handler<Type>;
  reject: Handler<any>;
}


export function usePromise<Type>(): (
  PromiseController<Type>
) {

  let resolve: Handler<Type> = () => {};
  let reject: Handler<any> = () => {};

  const promise = (
    new Promise<Type>(($resolve, $reject) => {
      resolve = (value: Type) => $resolve(value);
      reject = (error: any) => $reject(error);
    })
  );

  return { promise, resolve, reject };

}
