# _plugins/pagination_sitemap.rb

Jekyll::Hooks.register :pages, :post_render do |page|
  next unless page.url == '/sitemap.xml'

  site = page.site
  base_url = site.config['url'].to_s
  next if base_url.empty?

  pagination_pages = site.pages.select do |p|
    p.is_a?(Jekyll::PaginateV2::Generator::PaginationPage)
  end

  next if pagination_pages.empty?

  entries = pagination_pages.filter_map do |p|
    url = p.url
    next if url.nil? || url.empty?

    loc = url.gsub('/index.html', '/')
    loc = loc.end_with?('/') ? loc : "#{loc}/"

    "<url>\n<loc>#{base_url}#{loc}</loc>\n</url>"
  end

  next if entries.empty?

  page.output = page.output.sub('</urlset>', "#{entries.join("\n")}\n</urlset>")
end
