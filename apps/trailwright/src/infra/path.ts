// Reading and writing a document by dotted path: 'networking.management.gateway', 'nodes.0.serial_number'.
// Numeric segments index arrays. Writes return a new document and never change the one passed in.

type Json = Record<string, unknown>;

const segments = (path: string): string[] => (path === '' ? [] : path.split('.'));
const isIndex = (s: string): boolean => /^\d+$/.test(s);

export function getAt(doc: unknown, path: string): unknown {
  let node: unknown = doc;
  for (const s of segments(path)) {
    if (node === null || node === undefined) return undefined;
    if (Array.isArray(node)) node = isIndex(s) ? node[Number(s)] : undefined;
    else if (typeof node === 'object') node = (node as Json)[s];
    else return undefined;
  }
  return node;
}

function setIn(node: unknown, parts: string[], value: unknown): unknown {
  if (parts.length === 0) return value;
  const [head, ...rest] = parts;
  if (isIndex(head)) {
    const list = Array.isArray(node) ? [...node] : [];
    list[Number(head)] = setIn(list[Number(head)], rest, value);
    return list;
  }
  const obj: Json = node && typeof node === 'object' && !Array.isArray(node) ? { ...(node as Json) } : {};
  obj[head] = setIn(obj[head], rest, value);
  return obj;
}

export function setAt<T>(doc: T, path: string, value: unknown): T {
  return setIn(doc, segments(path), value) as T;
}

// Removes the key at path; empty objects left behind are removed too.
export function unsetAt<T>(doc: T, path: string): T {
  const parts = segments(path);
  const walk = (node: unknown, i: number): unknown => {
    if (node === null || typeof node !== 'object') return node;
    const key = parts[i];
    if (Array.isArray(node)) {
      if (!isIndex(key)) return node;
      const list = [...node];
      if (i === parts.length - 1) list.splice(Number(key), 1);
      else list[Number(key)] = walk(list[Number(key)], i + 1);
      return list;
    }
    const obj = { ...(node as Json) };
    if (!(key in obj)) return node;
    if (i === parts.length - 1) delete obj[key];
    else {
      const child = walk(obj[key], i + 1);
      if (child && typeof child === 'object' && !Array.isArray(child) && Object.keys(child).length === 0) delete obj[key];
      else obj[key] = child;
    }
    return obj;
  };
  return (parts.length === 0 ? doc : walk(doc, 0)) as T;
}

// An answer counts as given when it isn't empty: not undefined, null, '', or an empty list.
export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
