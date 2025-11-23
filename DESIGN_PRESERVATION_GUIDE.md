# Design Preservation & HTML Content Migration Guide

## Problem & Solution

The original issue was that dynamic content loading was breaking the page design. The solution is to **store the full HTML design** (with all styling and structure) in the admin panel's content field.

## How It Works

### 1. **Automatic HTML Design Extraction** (Already Done ✓)
We created `extract-html-design.js` which automatically extracted the original HTML designs from existing pages and saved them to `data/news.json` under the `htmlContent` field.

**Already extracted for 15 news articles:**
- bo-suu-tap-glamour-green-tinh-yeu-ngoc-luc-bao.html
- chim-dam-nhu-pham-hoang-nam.html
- cung-nhin-lai-hinh-anh-khai-truong-cac-hoat-dong-cua-gg-corporation-hanh-trinh-ruc-ro-chinh-thuc-bat-dau.html
- dao-dien-pham-hoang-nam-niels-lan-doky-hoi-ngo-thanh-lam-se-bung-no.html
- du-an-living-heritage-va-jazz-concert-dong-chay-am-nhac-cua-the-gioi.html
- g79-auto-chinh-thuc-khai-truong-showroom-dau-tien-tai-ha-noi.html
- gg-corporation-nha-tai-tro-chinh-dem-nhac-khat-vong.html
- hiep-si-jazz-niels-lan-doky-den-viet-nam-cuoc-gap-sau-20-nam-cho-doi.html
- huyen-thoai-jazz-niels-lan-doky-tro-lai-viet-nam-trong-dem-nhac-living-heritage-jazz-concert-immersed.html
- huyen-thoai-jazz-niels-lan-doky-tro-lai-viet-nam-voi-dem-nhac-immersed.html
- mot-thoi-de-nho-trong-dem-nhac-phu-quang.html
- nguoi-viet-gan-nhau-hon-nho-di-san-cho-tuong-lai.html
- phan-ung-cua-diva-thanh-lam-truoc-y-kien-ai-hat-hay-hon-ca-si.html
- trung-thu-sum-vay-gan-ket-dai-gia-dinh-g79-auto.html
- wellness-care-song-chu-dong-tai-tao-va-can-bang-cung-gg-young.html

### 2. **Dynamic Loader Enhancement** (Updated ✓)
Updated `assets/js/dynamic-detail-loader.js` to:
- Check for `htmlContent` field first (if available)
- Fall back to `content` field if `htmlContent` not present
- Inject the full HTML into the `.news-text` container

### 3. **Admin Panel Support** (Updated ✓)
The admin form now sends both `content` and `htmlContent` fields when you save, preserving the full HTML structure.

## How to Edit Content in Admin Panel

### Option 1: Simple Text (No Design Changes)
If you only want to change text without modifying the design:
1. Go to admin panel → Edit News Article
2. Edit the content in the "Content" field
3. The content will be preserved as full HTML on save

### Option 2: Full HTML Editing (Design Changes)
If you want to modify the design structure, you can edit the raw HTML:

**Example structure in Content field:**
```html
<p>Paragraph text here with <strong>bold</strong> and <em>italic</em>.</p>

<div class="ytb-embed-video">
  <iframe src="https://www.youtube.com/embed/VIDEO_ID" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>

<p>More paragraph text...</p>

<figure class="article-figure">
  <img src="/assets/media/shared/news/image.jpg" alt="Image description">
</figure>
```

### Supported HTML Tags
- `<p>` - Paragraphs
- `<strong>`, `<b>` - Bold text
- `<em>`, `<i>` - Italic text
- `<u>` - Underlined text
- `<h2>`, `<h3>`, `<h4>` - Subheadings
- `<ul>`, `<ol>`, `<li>` - Lists
- `<div>` - Containers with CSS classes
- `<figure>` - Image containers
- `<img>` - Images
- `<iframe>` - Embedded videos
- `<br>` - Line breaks
- `<blockquote>` - Quotes

## Workflow: From HTML Page to Admin Content

### Step 1: Copy Original HTML Design
1. Open the original HTML page (e.g., `bo-suu-tap-glamour-green-tinh-yeu-ngoc-luc-bao.html`)
2. Inspect the `.news-text` content block
3. Copy only the INNER HTML (not the wrapper div itself)

### Step 2: Paste into Admin Panel
1. Go to admin panel
2. Click "Edit News Article"
3. Find the article slug
4. Paste the HTML into the "Content (HTML)" field
5. Click "Save"

### Step 3: Verify on Frontend
1. Go to the live page URL
2. Refresh (don't use cache)
3. Content should load with original design intact

## Data Structure

### Before (Plain Text):
```json
{
  "id": 1,
  "urlSlug": "article-slug",
  "title": "Article Title",
  "content": "Plain text content here...",
  "imageUrl": "image.jpg"
}
```

### After (HTML Design):
```json
{
  "id": 1,
  "urlSlug": "article-slug",
  "title": "Article Title",
  "content": "Plain text content here...",
  "htmlContent": "<p>Paragraph with <strong>bold</strong>...</p><iframe>...</iframe>",
  "imageUrl": "image.jpg"
}
```

## How the System Loads Content

1. Page loads with static HTML structure (header, footer, layout)
2. JavaScript loader runs: `dynamic-detail-loader.js`
3. Loader extracts slug from URL
4. Loader calls API: `/api/news/slug/{slug}`
5. API returns article with `htmlContent` field
6. Loader finds `.news-text` element
7. Loader injects `htmlContent` into `.news-text`
8. Page displays with original design + updated content

## Important Notes

- **Design is preserved**: The `.news-text` HTML structure is stored in JSON
- **Real-time updates**: When you save in admin, changes appear immediately on frontend
- **Backward compatible**: If `htmlContent` doesn't exist, uses `content` instead
- **Edit freedom**: You can manually edit HTML in admin panel if needed
- **Image URLs**: Images should use absolute paths `/assets/media/...`
- **No JavaScript injection**: HTML is sanitized before display (safe)

## Examples

### Adding a YouTube Video
```html
<div class="ytb-embed-video">
  <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
</div>
```

### Adding an Image
```html
<figure class="article-figure">
  <img src="/assets/media/shared/news/my-image.jpg" alt="Image description">
</figure>
```

### Adding Formatted Text
```html
<p>This is <strong>important</strong> and this is <em>emphasized</em>.</p>

<blockquote>
  This is a quote from someone important.
</blockquote>

<ul>
  <li>First point</li>
  <li>Second point</li>
  <li>Third point</li>
</ul>
```

## Troubleshooting

### Design still broken?
1. Check that `htmlContent` is actually in the JSON file
2. Open browser DevTools → Network → check API response includes `htmlContent`
3. Check that `.news-text` element exists in HTML
4. Make sure all image URLs are correct (use `/assets/...` format)

### Content not updating?
1. Wait a few seconds (Railway might be deploying)
2. Hard refresh: `Ctrl+Shift+Delete` (Chrome) or `Cmd+Shift+Delete` (Mac)
3. Check admin panel saved successfully (look for "Success" message)

### Images not showing?
1. Use absolute paths: `/assets/media/shared/news/image.jpg`
2. Check image exists in that folder
3. Verify image filename doesn't have special characters

## Re-extract from HTML Files

If you need to re-extract designs from the original HTML files, run:

```bash
node extract-html-design.js
```

This will update all news articles with their original HTML designs from the root directory pages.
