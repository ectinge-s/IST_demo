const PortfolioPage = {
  build() {
    const data = DATA.portfolio || [];

    // Build filter buttons from unique academic_branch values, preserving source order
    const branches = ['全部', ...([...new Set(data.map(p => p.academic_branch).filter(Boolean))])];
    const cats = document.getElementById('portfolio-cats');
    cats.innerHTML = branches.map((b, i) =>
      `<button class="filter-btn${i === 0 ? ' is-active' : ''}"
               onclick="PortfolioPage.filter('${b}',this)">${b}</button>`
    ).join('');

    this._render('全部', data);
  },

  filter(branch, btn) {
    document.querySelectorAll('#portfolio-cats .filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    this._render(branch, DATA.portfolio || []);
  },

  _render(branch, data) {
    const items = branch === '全部' ? data : data.filter(p => p.academic_branch === branch);
    document.getElementById('portfolio-grid').innerHTML = items.map(p => {
      const otherSchools = (p.other_schools || []).filter(Boolean);
      return `
      <div class="port-card" onclick="alert('学生作品集页面（开发中）')">
        <div class="port-card__img">
          ${p.image
            ? `<img src="${p.image}" alt="${p.primary_school}" loading="lazy">`
            : `<span class="port-card__img-placeholder">${p.academic_branch || ''}</span>`}
          <span class="port-card__cat-tag">${p.academic_branch || ''}</span>
        </div>
        <div class="port-card__body">
          <div class="port-card__title">${p.primary_school || '—'}</div>
          <div class="port-card__program">${p.primary_program || ''}</div>
          ${otherSchools.length ? `<div class="port-card__other-schools">${otherSchools.join('　')}</div>` : ''}
          ${p.tags && p.tags.length ? `<div class="port-card__tags">${p.tags.map(t => `<span class="port-card__tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  },
};
window.PortfolioPage = PortfolioPage;
