# _plugins/static_files_cache.rb
Jekyll::Hooks.register :site, :post_read do |site|
  # 1. Хеш для перевірки існування файлу
  by_path = {}
  site.static_files.each { |f| by_path[f.relative_path] = true }
  site.data['_static_files_by_path'] = by_path

  Jekyll.logger.info 'StaticFilesCache:', "✓ Cached #{by_path.size} static files by path"

  # 2. Масив зображень — використовуємо relative_path як 'path'
  # щоб поведінка була ідентична оригінальному site.static_files
  image_exts = %w[.png .PNG .jpg .JPG .jpeg .JPEG]
  images = site.static_files
    .select { |f| image_exts.include?(f.extname) }
    .map    { |f|
      {
        'path'     => f.relative_path,  # відносний шлях як в оригіналі
        'basename' => f.basename,
        'extname'  => f.extname,
        'image'    => true              # для where: 'image', true
      }
    }
  site.data['_static_images'] = images

  Jekyll.logger.info 'StaticFilesCache:', "✓ Cached #{images.size} static images"
end