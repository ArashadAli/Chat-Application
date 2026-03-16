export function validate<T>(schema: { validate(data: unknown): T }, data: unknown): T {
  return schema.validate(data);
}