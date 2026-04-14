
const PRIVATE_METHODS_KEY = '__privateMethods';



export function getPrivateMethods(routerClass: any): string[] {
  return (routerClass as any)[PRIVATE_METHODS_KEY] ?? [];
}
