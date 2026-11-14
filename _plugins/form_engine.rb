# frozen_string_literal: true

# FormEngine build hook.
#
# Every file in _data that looks like a form config (version + id + settings +
# steps) and that some page opts into is turned into a ready-to-include page
# fragment, automatically, on every `jekyll build` / `jekyll serve`. Authors
# never run the Node generator by hand and never edit the generated file:
#
#   _data/<name>.yml                    # source of truth (edit this)
#   _includes/form/app/<name>.html      # baked fragment (generated)
#
# A page opts in with a single line:
#
#   {% include form/app/<name>.html %}
#
# The baked fragment is self-contained: config island + captcha wiring + inline
# map/engine CSS + wizard chrome + the rendered form + addon modals + the module
# loader (see assets/js/form-engine/shell.js). There is no Liquid shell anymore.
#
# Rules enforced here (a violation stops the build, nothing broken ships):
#   * the config must pass `node _form-engine/tools/validate-config.mjs`;
#   * the config `id` must equal the _data file name;
#   * a submit endpoint must resolve (config.submit.action, else
#     site.<name_with_underscores>_endpoint);
#   * Node must be available (CI: actions/setup-node; local: node on PATH).
#
# Baking runs on every build (one form is a fraction of a second, and a build is
# ~2 minutes). The generator is a no-op write when the fragment is unchanged, so
# `jekyll serve` watching _includes does not loop.

require 'json'
require 'open3'

module FormEngine
  ROOT = File.expand_path('..', __dir__)
  DATA_DIR = File.join(ROOT, '_data')
  APP_DIR = File.join(ROOT, '_includes', 'form', 'app')
  GEN_SCRIPT = File.join(ROOT, '_form-engine', 'tools', 'gen-form-app.mjs')
  VALIDATE_SCRIPT = File.join(ROOT, '_form-engine', 'tools', 'validate-config.mjs')

  SIGNATURE = %w[version id settings steps].freeze

  # Directories never scanned for `{% include form/app/<name>.html %}` lines.
  EXCLUDE_DIRS = %w[
    _site _data _includes/form/app _form-engine test .github assets
    node_modules .git .jekyll-cache __pycache__ vendor
  ].freeze

  # Matches the include TAG (not a mere mention in prose/comments).
  INCLUDE_RE = %r{\{%-?\s*include\s+form/app/([\w-]+)\.html}.freeze

  module_function

  # Only forms a page actually opts into (via an include line) are baked. This
  # keeps modal/inline forms - e.g. notify.yml, mounted by its own JS - out of
  # the bake, and means an unused _data file can never break the build.
  def referenced_forms
    found = {}
    Dir.glob(File.join(ROOT, '**', '*.{html,md}')).each do |path|
      rel = path[(ROOT.length + 1)..].tr('\\', '/')
      next if EXCLUDE_DIRS.any? { |d| rel == d || rel.start_with?("#{d}/") }

      content = begin
        File.read(path, encoding: 'UTF-8')
      rescue StandardError
        next
      end
      content.scan(INCLUDE_RE) { |m| found[m[0]] = true }
    end
    found
  end

  # True for a _data entry shaped like a form config.
  def form_config?(value)
    value.is_a?(Hash) &&
      SIGNATURE.all? { |k| value.key?(k) } &&
      value['id'].is_a?(String) &&
      value['steps'].is_a?(Array)
  end

  # Locates the backing file for a _data key (.yml / .yaml / .json).
  def data_path_for(name)
    %w[yml yaml json].each do |ext|
      candidate = File.join(DATA_DIR, "#{name}.#{ext}")
      return candidate if File.file?(candidate)
    end
    nil
  end

  def endpoint_for(site, name, config)
    submit = config['submit']
    action = submit.is_a?(Hash) ? submit['action'] : nil
    return action unless action.nil? || action.to_s.strip.empty?

    key = "#{name.tr('-', '_')}_endpoint"
    site.config[key]
  end

  # Runs the Node generator for one form. Raises FatalException on any failure.
  def bake(name, data_path, out_path, endpoint)
    payload = JSON.generate(name: name, data: data_path, out: out_path,
                            site: { endpoint: endpoint })
    out, status = Open3.capture2e('node', GEN_SCRIPT, '--stdin-json',
                                  stdin_data: payload, chdir: ROOT)
    return if status.success?

    fail_build("Не вдалося згенерувати форму «#{name}».\n#{out}")
  rescue Errno::ENOENT
    fail_build('Node.js не знайдено. Встановіть Node або додайте actions/setup-node у CI.')
  end

  def validate(name, data_path)
    out, status = Open3.capture2e('node', VALIDATE_SCRIPT, data_path, '--strict', chdir: ROOT)
    return if status.success?

    fail_build("Форма «#{name}» не пройшла перевірку конфігурації.\n#{out}")
  rescue Errno::ENOENT
    fail_build('Node.js не знайдено. Встановіть Node або додайте actions/setup-node у CI.')
  end

  def fail_build(message)
    raise Jekyll::Errors::FatalException, "FormEngine: #{message}"
  end

  def bake_all(site)
    referenced = referenced_forms
    baked = []
    site.data.each do |name, value|
      next unless form_config?(value)
      next unless referenced[name]

      data_path = data_path_for(name)
      next if data_path.nil?

      if value['id'] != name
        fail_build("Форма «#{name}»: поле id=\"#{value['id']}\" не збігається з назвою " \
                   "файлу _data/#{name}.yml. Перейменуйте файл або id.")
      end

      endpoint = endpoint_for(site, name, value)
      if endpoint.nil? || endpoint.to_s.strip.empty?
        fail_build("Форма «#{name}»: не вказано endpoint. Додайте submit.action у " \
                   "_data/#{name}.yml або #{name.tr('-', '_')}_endpoint у _config.yml.")
      end

      validate(name, data_path)
      bake(name, data_path, File.join(APP_DIR, "#{name}.html"), endpoint)
      baked << name
    end

    Jekyll.logger.info 'FormEngine:', "baked #{baked.join(', ')}" unless baked.empty?
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  FormEngine.bake_all(site)
end
