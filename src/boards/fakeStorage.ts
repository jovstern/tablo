/** An in-memory Storage for tests, with an optional capacity in characters to simulate a full quota. */
export function fakeStorage(capacity = Infinity): Storage {
  const items = new Map<string, string>()
  const used = () => [...items].reduce((n, [k, v]) => n + k.length + v.length, 0)
  return {
    get length() {
      return items.size
    },
    key: (i) => [...items.keys()][i] ?? null,
    getItem: (k) => items.get(k) ?? null,
    setItem(k, v) {
      const before = items.get(k)
      const next =
        used() - (before === undefined ? 0 : k.length + before.length) + k.length + v.length
      if (next > capacity)
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      items.set(k, v)
    },
    removeItem: (k) => void items.delete(k),
    clear: () => items.clear(),
  }
}
