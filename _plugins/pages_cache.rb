# _plugins/pages_cache.rb

Jekyll::Hooks.register :site, :post_read do |site|
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

  html_pages = site.pages.select { |p| p.html? }

  sorted_asc = html_pages
    .sort_by { |p| p.path }
    .map { |p| {
      'url'      => p.url,
      'dir'      => p.dir,
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

  by_parent = Hash.new { |h, k| h[k] = [] }
  sorted_asc.each do |p|
    url  = p['url']
    slug = url.split('/').last || ''
    parent = url.sub(slug, '').gsub('//', '/').then { |s| s.end_with?('/') ? s : s + '/' }
    by_parent[parent] << p
  end
  site.data['_html_pages_by_parent'] = by_parent

  Jekyll.logger.info 'PagesCache:', "✓ Cached #{sorted_asc.size} html_pages + parent index"

  top_nav_main = sorted_asc.select do |p|
    p['dir'] == '/' &&
    p['url'] != '/' &&
    p['url'] != '/add.html' &&
    p['navhide'] != 1 &&
    p['title'].to_s != ''
  end

  top_nav_add = sorted_asc.select do |p|
    p['dir'] == '/' &&
    p['url'] != '/' &&
    p['url'] == '/add.html' &&
    p['navhide'] != 1 &&
    p['title'].to_s != ''
  end

  site.data['_top_nav_main'] = top_nav_main
  site.data['_top_nav_add']  = top_nav_add

  Jekyll.logger.info 'PagesCache:', "✓ Cached top-nav (#{top_nav_main.size} main + #{top_nav_add.size} add)"

  posts_by_dir = Hash.new { |h, k| h[k] = [] }
  site.posts.docs.each do |post|
    next if post.data['hidden'] == true
    url = post.url
    parts = url.split('/').reject(&:empty?)
    (1...parts.size).each do |i|
      dir_key = '/' + parts[0...i].join('/') + '/'
      posts_by_dir[dir_key] << {
        'url'    => post.url,
        'title'  => post.data['title'],
        'hidden' => post.data['hidden']
      }
    end
  end
  site.data['_posts_by_dir'] = posts_by_dir

  Jekyll.logger.info 'PagesCache:', "✓ Cached posts by dir (#{site.posts.docs.size} posts)"

  ads_pages = sorted_asc.select { |p| p['ads'] == 1 }
  site.data['_ads_pages'] = ads_pages
  Jekyll.logger.info 'PagesCache:', "✓ Cached #{ads_pages.size} ads pages"
end