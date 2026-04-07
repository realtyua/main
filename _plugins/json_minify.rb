module Jekyll
  module JsonFilter
    def json_minify(input)
      JSON.generate(JSON.parse(input.to_s))
    end
  end
end

Liquid::Template.register_filter Jekyll::JsonFilter
