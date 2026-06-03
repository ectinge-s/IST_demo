/* ═══════════════════════════════════════════
   DATA LOADER
   Fetches all JSON files and caches them.
   Usage: await DATA.load(); then DATA.careers etc.
═══════════════════════════════════════════ */
const DATA = (() => {
  const cache = {};
  const BASE = './data/';
  const FILES = ['careers','courses','programs','instructors','resources','taxonomy','school_priority','timeline'];

  async function load() {
    await Promise.all(FILES.map(async name => {
      const r = await fetch(BASE + name + '.json');
      cache[name] = await r.json();
    }));
  }

  // Proxy: DATA.careers → cache.careers
  return new Proxy({ load }, {
    get(target, prop) {
      if (prop === 'load') return target.load;
      return cache[prop];
    }
  });
})();
