import { FunctionType, GraphQLInputFields, GraphQLReturnType, ListType, ReferenceType, ScalarType, SelfType } from './ast';

export const Bool = new ScalarType('Bool');
export const Float = new ScalarType('Float');
export const ID = new ScalarType('ID');
export const Int = new ScalarType('Int');
export const String = new ScalarType('String');

export function List<T extends GraphQLReturnType>(item: T): ListType<T> {
  return new ListType(item);
}

export function Function<
  Args extends GraphQLInputFields,
  Returns extends GraphQLReturnType
>(args: Args, returns: Returns): FunctionType<Args, Returns> {
  return new FunctionType(args, returns);
}

export function $<ID extends string>(id: ID): ReferenceType<ID> {
  return new ReferenceType(id);
}

export const Self = new SelfType();