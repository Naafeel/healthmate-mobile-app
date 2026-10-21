/** Serialize whole repository operations, including backup transactions, on the shared connection. */
let tail: Promise<unknown> = Promise.resolve();
export function databaseAccess<T>(work: () => Promise<T>): Promise<T> { const next=tail.then(work,work);tail=next.catch(()=>undefined);return next; }
export function serializeRepository<T extends object>(repository: T): T {return new Proxy(repository,{get(target,key){const member=Reflect.get(target,key);return typeof member==='function' ? (...args: unknown[])=>databaseAccess(()=>member.apply(target,args)) : member;}});}
