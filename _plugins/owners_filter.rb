# _plugins/owners_filter.rb
require 'set'

module Jekyll
  module OwnersFilter

    # Liquid-фільтр залишається для зворотної сумісності,
    # але тепер просто повертає вже обчислений кеш із site.data
    def unique_owners_with_phone(_items)
      site = @context.registers[:site]
      site.data['_cached_owners'] || []
    end

  end
end

Liquid::Template.register_filter(Jekyll::OwnersFilter)

# ─────────────────────────────────────────────
# Hook: рахуємо owners ОДИН РАЗ після завантаження даних
# ─────────────────────────────────────────────
Jekyll::Hooks.register :site, :post_read do |site|
  require 'set'

  logged_duplicate_ids = Set.new

  # 1. Збираємо всі items (estates + owners), фільтруємо hidden
  estates = (site.data['estates'] || []).reject { |i| i['hidden'] == true }
  owners  = (site.data['owners']  || [])
  all_items = estates + owners

  # 2. Парсимо дати один раз і логуємо дублікати за id
  id_groups  = Hash.new { |h, k| h[k] = [] }
  valid_items = []

  all_items.each do |item|
    next if item['hidden'] == true

    item_id  = item['id']
    date_str = item['date']

    timestamp = begin
      date_str ? DateTime.parse(date_str).to_time.to_i : 0
    rescue
      0
    end

    id_groups[item_id] << item if item_id
    valid_items << { data: item, timestamp: timestamp }
  end

  # 3. Логування дублікатів (тільки один раз за збірку)
  id_groups.each do |item_id, group|
    next if group.length < 2
    next if logged_duplicate_ids.include?(item_id)

    logged_duplicate_ids.add(item_id)
    Jekyll.logger.warn 'OwnersFilter:', "⚠️  Duplicate ID: #{item_id} (#{group.length} occurrences)"

    group.each do |dup|
      seller = dup['seller']&.strip&.empty? ? nil : dup['seller']
      phone  = dup['phone']
      date   = dup['date'] || '(no date)'
      parts  = []
      parts << "seller: '#{seller}'" if seller
      parts << "phone: #{phone}"     if phone
      Jekyll.logger.info 'OwnersFilter:', "  → #{parts.empty? ? '(no data)' : parts.join(', ')} | date: #{date}"
    end
  end

  # 4. Сортуємо: старіші спочатку → дедупліковуємо по телефону
  sorted     = valid_items.sort_by { |i| i[:timestamp] }
  seen_phones  = Set.new
  selected   = []

  sorted.each do |wrapper|
    item      = wrapper[:data]
    phone_raw = item['phone']
    next unless phone_raw

    phone_digits = phone_raw.to_s.delete('^0-9')
    next unless phone_digits.length == 12 && phone_digits.start_with?('380')

    if item['skip']
      selected << item
    else
      unless seen_phones.include?(phone_digits)
        seen_phones.add(phone_digits)
        selected << item
      end
    end
  end

  # 5. Фінальне сортування: новіші спочатку
  result = selected.sort_by do |i|
    begin
      i['date'] ? -DateTime.parse(i['date']).to_time.to_i : 0
    rescue
      0
    end
  end

  # 6. Зберігаємо в site.data — доступно як site.data._cached_owners
  site.data['_cached_owners'] = result

  Jekyll.logger.info 'OwnersFilter:', "✓ Cached #{result.length} unique owners (computed once)"

  # ─────────────────────────────────────────────
  # Кешуємо records для all.html:
  # owners + sellers відсортовані по даті — один раз.
  # where_exp по location залишається в Liquid —
  # він різний для кожної сторінки, його не кешуємо.
  # ─────────────────────────────────────────────
  # Sellers визначаються автоматично з _includes/data/sallers.html —
  # єдиного місця де ти керуєш списком. Hook парсить файл як текст
  # і витягує ключі з рядків виду: assign KEY = site.data.KEY
  sallers_path = File.join(site.source, '_includes', 'data', 'sallers.html')
  sellers_keys = []
  if File.exist?(sallers_path)
    File.read(sallers_path).scan(/assign\s+(\w+)\s*=\s*site\.data\.\w+/) do |match|
      key = match[0]
      next if %w[records owners].include?(key)
      sellers_keys << key
    end
  end
  sellers_data = sellers_keys.flat_map { |k| site.data[k] || [] }
  Jekyll.logger.info 'OwnersFilter:', "✓ Sellers from sallers.html: #{sellers_keys.join(', ')}"

  records = (result + sellers_data).sort_by do |i|
    begin
      i['date'] ? -DateTime.parse(i['date']).to_time.to_i : 0
    rescue
      0
    end
  end

  site.data['_cached_records'] = records

  Jekyll.logger.info 'OwnersFilter:', "✓ Cached #{records.length} records (computed once)"
end