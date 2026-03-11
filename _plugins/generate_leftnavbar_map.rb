# _plugins/generate_leftnavbar_map.rb
# v9 - optimized: pre-built indexes, File.exist? cache, single-pass data prep
module Jekyll
  class LeftNavbarMapTag < Liquid::Tag
    def render(context)
      site  = context.registers[:site]
      page  = context.registers[:page]
      generate_menu(site, page)
    end

    private

    def generate_menu(site, current_page)
      # --- Підготовка даних (один прохід) ---

      # Всі index.html без navhide фільтра (потрібно для city/town секцій)
      all_index = site.pages
                      .select  { |p| p.name == 'index.html' }
                      .sort_by { |p| p.path }

      # Кеш File.exist? — викликаємо тільки один раз для кожного шляху
      map_exists = {}
      all_index.each do |p|
        dir      = p.dir.end_with?('/') ? p.dir : p.dir + '/'
        map_path = (dir + 'map.html').sub(/^\/+/, '')
        full     = File.join(site.source, map_path)
        map_exists[dir] = File.exist?(full)
      end

      # Індекс: parent_url => [дочірні index сторінки з navhide != 1]
      children_by_parent = Hash.new { |h, k| h[k] = [] }
      all_index.each do |p|
        next if p.data['navhide'] == 1
        children_by_parent[parent_clean_url(p)] << p
      end

      # Індекс: dir => [підкатегорії map.html]
      # map.html сторінки згруповані за батьківською директорією
      all_maps = site.pages.select { |p| p.url.end_with?('/map.html') }
      subcats_by_dir = Hash.new { |h, k| h[k] = [] }
      all_maps.each do |map|
        map_dir = map.dir.end_with?('/') ? map.dir : map.dir + '/'
        # Батько цього map.html = його dir
        # Він є підкатегорією для всіх батьківських dir вище
        subcats_by_dir[map_dir] << map
      end

      # --- Будуємо список секцій ---
      ones = all_index.select { |p| dir_depth(p.dir) == 1 && p.data['navhide'] != 1 }
                      .sort_by { |p| p.path }.reverse

      sections = []
      ones.each do |one|
        section_url = clean_url(one)
        sections << { page: one, url: section_url } unless section_url == '/region/'

        # Шукаємо city/town підсекції (navhide ігноруємо)
        all_index.each do |two|
          next unless dir_depth(two.dir) == 2
          two_url    = clean_url(two)
          parent_two = parent_clean_url(two)
          condition  = (section_url == parent_two && two_url.include?('city')) ||
                       (section_url == parent_two && two_url.include?('town'))
          next unless condition
          sections << { page: two, url: two_url }
        end
      end

      # --- Рендеримо секції ---
      output = []
      sections.each do |sec|
        title        = escape_title(sec[:page].data['navtitle'] || sec[:page].data['title'] || '')
        subpage_html = render_subpage(
          current_page, sec[:url],
          children_by_parent, subcats_by_dir, map_exists
        )
        next if subpage_html.empty?

        output << "<details>"
        output << "<summary>#{title}</summary>"
        output << subpage_html
        output << "</details>"
      end

      output.join("\n")
    end

    def render_subpage(current_page, current_url, children_by_parent, subcats_by_dir, map_exists)
      items = children_by_parent[current_url]
      return '' if items.empty?

      output = []
      items.each do |second|
        dir = second.dir.end_with?('/') ? second.dir : second.dir + '/'
        next unless map_exists[dir]

        map_page = dir + 'map.html'
        title    = escape_title(second.data['title']    || '')
        navtitle = escape_title(second.data['navtitle'] || title)

        if current_page['url'] == map_page
          output << "<li><span>#{navtitle}</span>"
        else
          output << "<li><a href=\"#{map_page}\">#{navtitle}</a>"
        end

        # Підкатегорії: map.html що знаходяться всередині dir (але не сам dir/map.html)
        subcats = subcats_by_dir.select { |k, _| k.start_with?(dir) && k != dir }
                                .values.flatten.sort_by { |m| m.dir }

        if subcats.any?
          output << "<ul class=\"list-unstyled\">"
          subcats.each do |map|
            map_navtitle = escape_title(map.data['navtitle'] || '')
            if map.url == current_page['url']
              output << "<li><span>#{map_navtitle}</span></li>"
            else
              output << "<li><a href=\"#{map.url}\">#{map_navtitle}</a></li>"
            end
          end
          output << "</ul>"
        end

        output << "</li>"
      end

      return '' if output.empty?

      html  = "<ul class=\"list-unstyled\">\n"
      html += output.join("\n")
      html += "\n</ul>\n"
      html += "<p><a href=\"#{current_url}\">&gt;&gt;</a></p>\n"
      html
    end

    def clean_url(page)
      page.dir.end_with?('/') ? page.dir : page.dir + '/'
    end

    def parent_clean_url(page)
      dir  = page.dir.end_with?('/') ? page.dir : page.dir + '/'
      segs = dir.split('/').reject(&:empty?)
      return '/' if segs.size <= 1
      '/' + segs[0..-2].join('/') + '/'
    end

    def dir_depth(dir)
      dir.split('/').reject(&:empty?).size
    end

    def escape_title(str)
      str.to_s.gsub("'", '′')
    end
  end
end

Liquid::Template.register_tag('leftnavbar_map', Jekyll::LeftNavbarMapTag)