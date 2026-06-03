/* ═══════════════════════════════════════════
   OFFERS PAGE — 2026 申请季 offer 展示
═══════════════════════════════════════════ */
const OffersPage = {
  build() {
    const totalEl = document.getElementById('offers-total');
    if (totalEl && DATA.offers) {
      totalEl.innerHTML = `
        <div class="offers-total">
          <span class="offers-total__num">${DATA.offers.total_offers}+</span>
          <span class="offers-total__label">份 offer</span>
        </div>`;
    }
    this._render('US');
  },

  switchGroup(group, btn) {
    document.querySelectorAll('#offers-country-tabs .filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    this._render(group);
  },

  _render(group) {
    const grid = document.getElementById('offers-grid');
    if (!grid || !DATA.offers) return;
    const d = DATA.offers.groups[group];
    if (!d) return;

    grid.innerHTML = `
      <div class="offers-summary">
        <span class="offers-summary__total">${d.total_offers}+</span>
        <span class="offers-summary__label">份 offer · ${d.label}</span>
      </div>
      <div class="offers-grid">
        ${d.featured.map(s => `
          <div class="offer-card">
            <div class="offer-card__count">${s.offer_count}</div>
            <div class="offer-card__school-zh">${s.school_zh}</div>
            <div class="offer-card__school-en">${s.school_en}</div>
          </div>`).join('')}
      </div>`;
  },
};
// expose for inline event handlers
window.OffersPage = OffersPage;
