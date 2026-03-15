# _plugins/pages_cache.rb
# Будує lookup-таблиці сторінок один раз після завантаження.

Jekyll::Hooks.register :site, :post_read do |site|
  # 1. Хеш url => {breadcrumb, navtitle, title} для location.html і breadcrumb.html
  lookup = {}
  site.pages.each do |page|
    url = page.url
    next unless url
    lookup[url] = {
      'breadcrumb' => page.data['breadcrumb'],
      'navtitle'   => page.data['navtitle'],
      'title'      => page.data['title']
    }
  end
  site.data['_pages_by_url'] = lookup
  Jekyll.logger.info 'PagesCache:', "✓ Cached #{lookup.size} pages by URL"

  # 2. Відфільтровані html_pages для navbar.html
  # Замість site.html_pages | sort: 'path' | reverse — один раз
  html_pages = site.pages.select { |p| p.html? }

  sorted_asc = html_pages
    .sort_by { |p| p.path }
    .map { |p| {
      'url'      => p.url,
      'path'     => p.path,
      'title'    => p.data['title'],
      'navtitle' => p.data['navtitle'],
      'navhide'  => p.data['navhide'],
      'subtitle' => p.data['subtitle'],
      'ads'      => p.data['ads']
    }}

  sorted_desc = sorted_asc.reverse

  site.data['_html_pages_sorted_asc']  = sorted_asc
  site.data['_html_pages_sorted_desc'] = sorted_desc

  # 3. Хеш parent_url => [дочірні сторінки] для dropdown.html
  # Замість циклу по всіх html_pages всередині navbar
  by_parent = Hash.new { |h, k| h[k] = [] }
  sorted_asc.each do |p|
    url  = p['url']
    slug = url.split('/').last || ''
    parent = url.sub(slug, '').gsub('//', '/').then { |s| s.end_with?('/') ? s : s + '/' }
    by_parent[parent] << p
  end
  site.data['_html_pages_by_parent'] = by_parent

  Jekyll.logger.info 'PagesCache:', "✓ Cached #{sorted_asc.size} html_pages + parent index"
end