/* eslint-disable @typescript-eslint/ban-types */
export type KeysOfType<A extends object, B> = { [K in keyof A]-?: A[K] extends B ? K : never }[keyof A];
export type RowLacks<A extends object, K extends string | number | symbol> = A & Record<Extract<keyof A, K>, never>;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I)=>void) ? I : never;
