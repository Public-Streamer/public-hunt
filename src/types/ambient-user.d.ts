
/**
 * Ambient declaration to satisfy references to a global `user` identifier
 * in legacy components we cannot modify here.
 * Note: This only satisfies TypeScript; at runtime, ensure `user` exists where used.
 */
declare const user: any;
