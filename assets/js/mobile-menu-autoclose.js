/*!
 * Mobile Menu Auto-Close (generic)
 * - Đóng overlay menu khi bấm link
 * - Với link neo cùng trang: chặn reload, scroll mượt tới id
 * Mặc định dùng #mobileMenuOverlay + class .active để hiển thị
 */
(function () {
  const SELECTOR_OVERLAY = '#mobileMenuOverlay';     // chỉnh nếu qua đổi id
  const ACTIVE_CLASS     = 'active';                  // class đang mở menu
  const LINK_SELECTOR    = 'a';                       // link bên trong overlay  function isSamePageHash(a) {
    const href = a.getAttribute('href') || '';
    if (!href) return false;
    // Dạng "#id" hoặc "/#id"
    if (href.startsWith('#') || href.startsWith('/#')) return true;
    // Dạng "current/path#id"
    try {
      const url = new URL(href, location.href);
      return url.pathname === location.pathname && !!url.hash;
    } catch { return false; }
  }  function getHash(a) {
    const href = a.getAttribute('href') || '';
    if (a.hash) return a.hash;
    if (href.startsWith('/#')) return '#' + href.slice(2);
    if (href.startsWith('#'))  return href;
    try {
      const url = new URL(href, location.href);
      return url.hash || '';
    } catch { return ''; }
  }  function closeMenu(overlay) {
    overlay.classList.remove(ACTIVE_CLASS);
    // Nếu đang khoá scroll body khi mở menu
    document.body.style.overflow = '';
  }  function smoothScrollTo(hash) {
    const id = (hash || '').replace(/^\/?#/, '');
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Cập nhật URL (không reload trang)
      history.pushState(null, '', '#' + id);
    }
  }  function bind() {
    const overlay = document.querySelector(SELECTOR_OVERLAY);
    if (!overlay) return;    // Ủy quyền sự kiện click cho mọi <a> bên trong overlay (bền vững)
    overlay.addEventListener('click', function (e) {
      const a = e.target.closest(LINK_SELECTOR);
      if (!a) return;      // Đóng menu ngay
      closeMenu(overlay);      // Link neo cùng trang → chặn điều hướng & scroll mượt
      if (isSamePageHash(a)) {
        e.preventDefault();
        smoothScrollTo(getHash(a));
      }
      // Link sang trang khác: để trình duyệt điều hướng bình thường
    });
  }  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
