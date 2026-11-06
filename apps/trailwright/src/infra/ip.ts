// IPv4 arithmetic for the checks and suggestions. Plain numbers, no bit operators: JavaScript bit operators are signed 32-bit.

const ipv4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const cidr = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\/([0-9]|[12]\d|3[0-2])$/;

export const isIpv4 = (v: unknown): v is string => typeof v === 'string' && ipv4.test(v);
export const isCidr = (v: unknown): v is string => typeof v === 'string' && cidr.test(v);

export const toNumber = (ip: string): number => ip.split('.').reduce((n, part) => n * 256 + Number(part), 0);
export const toIp = (n: number): string => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');

export function range(c: string): { first: number; last: number; bits: number } {
  const [address, bitsText] = c.split('/');
  const bits = Number(bitsText);
  const size = 2 ** (32 - bits);
  const first = toNumber(address) - (toNumber(address) % size);
  return { first, last: first + size - 1, bits };
}

export const inSubnet = (ip: string, c: string): boolean => {
  const r = range(c);
  const n = toNumber(ip);
  return n >= r.first && n <= r.last;
};

export function subnetMask(c: string): string {
  const bits = range(c).bits;
  return toIp(bits === 0 ? 0 : 2 ** 32 - 2 ** (32 - bits));
}

// The first usable address of a subnet: the usual gateway.
export const firstHost = (c: string): string => toIp(range(c).first + 1);

// A run of `size` consecutive free addresses in the subnet, starting after `startOffset`, skipping the ones in use.
export function freeRun(c: string, used: string[], size: number, startOffset = 20): { start: string; end: string } | undefined {
  const r = range(c);
  const taken = new Set(used.filter(isIpv4).map(toNumber));
  for (let start = r.first + startOffset; start + size - 1 < r.last; start++) {
    let ok = true;
    for (let n = start; n < start + size; n++) if (taken.has(n)) { ok = false; start = n; break; }
    if (ok) return { start: toIp(start), end: toIp(start + size - 1) };
  }
  return undefined;
}
