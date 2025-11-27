(function () {
    var path = location.pathname; // ví dụ: /, /index.html, /en/index.html, /ccg1/, /ccg1/en/page.html
    var m = path.match(/^\/([^/]+)\//); // nếu có thư mục con (ví dụ /ccg1/)
    // Nếu first segment là 'en' thì coi site ở root -> base = '/'
    var base = '/';
    if (m && m[1] !== 'en') {
        base = '/' + m[1] + '/';
    }

    // rest là phần sau base (ví dụ: '', 'en/', 'about.html', 'en/about.html')
    var rest = path.slice(base.length);
    var isEN = rest.startsWith('en/');

    // tạo đường dẫn trang đối ứng (giữ query + hash)
    var newRest = isEN ? rest.slice(3) : ('en/' + rest);
    var counterpart = base + newRest;

    // tìm tất cả các nút/chỗ chuyển ngôn ngữ
    var switches = document.querySelectorAll('.langSwitch');
    if (!switches || switches.length === 0) return;

    var targetHref = counterpart + (location.search || '') + (location.hash || '');

    // đường dẫn ảnh dựa trên base (vd: '/' => '/assets/..' ; '/ccg1/' => '/ccg1/assets/..')
    var imgPathBase = base + 'assets/img/shared/';
    var imgFile = isEN ? 'vi-lang.png' : 'us-lang.png';
    var imgAlt = isEN ? 'Tiếng Việt' : 'English';

    switches.forEach(function (link) {
        try { link.href = targetHref; } catch (e) { /* ignore if not anchor */ }

        var icon = link.querySelector('img');
        if (icon) {
            // cập nhật src và alt
            icon.src = imgPathBase + imgFile;
            icon.alt = imgAlt;
        }
    });
})();
