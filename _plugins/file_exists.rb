module Jekyll
  class FileExistsTag < Liquid::Tag

    @@file_cache = {}

    def initialize(tag_name, path, tokens)
      super
      @path = path
    end

    def render(context)
      url = Liquid::Template.parse(@path).render context
      site_source = context.registers[:site].config['source']
      file_path = (site_source + '/' + url).strip

      unless @@file_cache.key?(file_path)
        @@file_cache[file_path] = File.exist?(file_path)
      end

      "#{@@file_cache[file_path]}"
    end
  end
end

Liquid::Template.register_tag('file_exists', Jekyll::FileExistsTag)