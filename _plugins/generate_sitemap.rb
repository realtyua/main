# _plugins/site_map_tag.rb
module Jekyll
  class SiteMapTag < Liquid::Tag
    def render(context)
      @site = context.registers[:site]
      @page = context.registers[:page]
      @page_url = normalize_url(@page['url'] || '')

      html_pages = @site.pages.select { |p| p.is_a?(Jekyll::Page) && p.extname == '.html' }

      region_slug = @page['region_slug'] || ''
      main_region = "/region/#{region_slug}/map.html"

      rps1 = html_pages.select { |p| p['dir'] == '/news/' || p['dir'] == '/articles/' || p['url'] == main_region }
      rps0 = html_pages.select { |p| p['dir'] == '/' && p['name'] != '404.html' && p['name'] != 'index.html' }
      @rps = rps0 + rps1
      @all_pages = html_pages.sort_by { |p| p['path'] || '' }.reverse

      output = +''
      output << "<hr>"
      output << "<div class=\"row mt-3\">"

      output << "<div class=\"col-sm-6 col-md-3\">"
      output << "<p class=\"h6\">"
      output << "<a href=\"/\">Головна</a>"
      output << "</p>"
      output << "<ul class=\"list-unstyled\">"

      @rps.each do |rp|
        next if rp['url']&.match?(/\/new\.html$|\/add\.html$/)
        title = safe_title(rp)
        url = normalize_url(rp['url'])
        if url == @page_url
          output << "<li class=\"mb-2\">#{title}</li>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a></li>"
        end
      end

      output << "</ul>"
      output << "</div>"

      output << "<div class=\"col-sm-6 col-md-3\">"
      city_page = html_pages.find { |p| p['url'] == '/region/city/' }
      if city_page
        title = safe_title(city_page)
        url = normalize_url(city_page['url'])
        if url == @page_url
          output << "<p class=\"h6\">#{title}</p>"
        else
          output << "<p class=\"h6\"><a href=\"#{url}\">#{title}</a></p>"
        end
      end
      output << "<ul class=\"list-unstyled\">"
      output << render_cities('/region/city/')
      output << "</ul>"
      output << "</div>"

      output << "<div class=\"col-sm-6 col-md-3\">"
      district_page = html_pages.find { |p| p['url'] == '/district/' }
      if district_page
        title = safe_title(district_page)
        url = normalize_url(district_page['url'])
        if url == @page_url
          output << "<p class=\"h6\">#{title}</p>"
        else
          output << "<p class=\"h6\"><a href=\"#{url}\">#{title}</a></p>"
        end
      end
      output << "<ul class=\"list-unstyled\">"
      output << render_districts('/district/')
      output << "</ul>"
      output << "</div>"

      output << "<div class=\"col-sm-6 col-md-3\">"
      town_page = html_pages.find { |p| p['url'] == '/district/town/' }
      if town_page
        title = safe_title(town_page)
        url = normalize_url(town_page['url'])
        if url == @page_url
          output << "<p class=\"h6\">#{title}</p>"
        else
          output << "<p class=\"h6\"><a href=\"#{url}\">#{title}</a></p>"
        end
      end
      output << "<ul class=\"list-unstyled\">"
      output << render_towns('/district/town/')
      output << "</ul>"
      output << "</div>"

      output << "</div>"
      output << "<hr class=\"mt-2\">"
      output
    end

    private

    def normalize_url(url)
      return '/' unless url
      url = url.to_s.gsub(/index\.html$/, '')
      url = url.gsub(%r{/+}, '/')
      url = url.end_with?('.html') ? url : url.chomp('/') + '/'
      url == '//' ? '/' : url
    end

    def path_depth(dir)
      return 0 unless dir
      dir.to_s.split('/').size
    end

    def safe_title(page)
      page['navtitle'] || page['title'] || ''
    end

    def render_cities(parent_path)
      output = +''
      cities = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(parent_path) &&
        p['dir'] != parent_path &&
        p['dir'].split('/').reject(&:empty?).size == 3 &&
        p['navhide'] != 1
      end.sort_by { |p| p['dir'] || '' }

      cities.each do |city|
        title = safe_title(city)
        url = normalize_url(city['url'])
        if url == @page_url
          output << "<li class=\"mb-2\"><span>#{title}</span>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a>"
        end

        children = render_city_children(city['dir'])
        if !children.empty?
          output << "<ul class=\"list-unstyled border-left border-primary mt-1 ml-1 pl-2\">"
          output << children
          output << "</ul>"
        end

        output << "</li>"
      end

      output
    end

    def render_city_children(city_path)
      output = +''
      children = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(city_path) &&
        p['dir'] != city_path &&
        p['navhide'] != 1 &&
        !p['title'].to_s.empty?
      end.sort_by { |p| p['dir'] || '' }

      children.each do |child|
        depth = path_depth(child['dir'])
        next unless (child['url']&.include?('/city/') || child['url']&.include?('/town/')) && depth < 6

        title = safe_title(child)
        url = normalize_url(child['url'])
        if url == @page_url
          output << "<li class=\"mb-2\">#{title}</li>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a></li>"
        end
      end

      output
    end

    def render_districts(parent_path)
      output = +''
      districts = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(parent_path) &&
        p['dir'] != parent_path &&
        p['dir'].split('/').reject(&:empty?).size == 2 &&
        !p['url']&.include?('/town/') &&
        p['navhide'] != 1
      end.sort_by { |p| p['dir'] || '' }

      districts.each do |district|
        title = safe_title(district)
        url = normalize_url(district['url'])
        if url == @page_url
          output << "<li class=\"mb-2\"><span>#{title}</span>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a>"
        end

        children = render_district_children(district['dir'])
        if !children.empty?
          output << "<ul class=\"list-unstyled border-left border-primary mt-1 ml-1 pl-2\">"
          output << children
          output << "</ul>"
        end

        output << "</li>"
      end

      output
    end

    def render_district_children(district_path)
      output = +''
      children = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(district_path) &&
        p['dir'] != district_path &&
        p['navhide'] != 1 &&
        !p['title'].to_s.empty?
      end.sort_by { |p| p['dir'] || '' }

      children.each do |child|
        depth = path_depth(child['dir'])
        next unless child['url']&.include?('/district/') && depth < 5

        title = safe_title(child)
        url = normalize_url(child['url'])
        if url == @page_url
          output << "<li class=\"mb-2\">#{title}</li>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a></li>"
        end
      end

      output
    end

    def render_towns(parent_path)
      output = +''
      towns = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(parent_path) &&
        p['dir'] != parent_path &&
        p['dir'].split('/').reject(&:empty?).size == 3 &&
        p['navhide'] != 1
      end.sort_by { |p| p['dir'] || '' }

      towns.each do |town|
        title = safe_title(town)
        url = normalize_url(town['url'])
        if url == @page_url
          output << "<li class=\"mb-2\"><span>#{title}</span>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a>"
        end

        children = render_town_children(town['dir'])
        if !children.empty?
          output << "<ul class=\"list-unstyled border-left border-primary mt-1 ml-1 pl-2\">"
          output << children
          output << "</ul>"
        end

        output << "</li>"
      end

      output
    end

    def render_town_children(town_path)
      output = +''
      children = @site.pages.select do |p|
        p.is_a?(Jekyll::Page) &&
        p['dir']&.start_with?(town_path) &&
        p['dir'] != town_path &&
        p['navhide'] != 1 &&
        !p['title'].to_s.empty?
      end.sort_by { |p| p['dir'] || '' }

      children.each do |child|
        depth = path_depth(child['dir'])
        next unless child['url']&.include?('/town/') && depth < 6

        title = safe_title(child)
        url = normalize_url(child['url'])
        if url == @page_url
          output << "<li class=\"mb-2\">#{title}</li>"
        else
          output << "<li class=\"mb-2\"><a href=\"#{url}\">#{title}</a></li>"
        end
      end

      output
    end
  end
end

Liquid::Template.register_tag('sitemap', Jekyll::SiteMapTag)