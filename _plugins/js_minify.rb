module Jekyll
  module JsFilter
    def js_minify(input)
      input.to_s.gsub(/\s+/, ' ').strip
    end
  end
end

Liquid::Template.register_filter Jekyll::JsFilter
