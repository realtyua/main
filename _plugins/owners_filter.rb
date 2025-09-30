# _plugins/owners_filter.rb (оптимізована версія)
require 'set'

module Jekyll
  module OwnersFilter
    @@logged_duplicate_ids = Set.new

    def unique_owners_with_phone(items)
      # --- Крок 1: Фільтруємо hidden та готуємо дані ---
      valid_items = []
      id_groups = Hash.new { |h, k| h[k] = [] }

      items.each do |item|
        next if item["hidden"] == true

        item_id = item["id"]
        date_str = item["date"]

        # Парсимо дату один раз
        begin
          timestamp = date_str ? DateTime.parse(date_str).to_time.to_i : 0
        rescue
          timestamp = 0
        end

        # Додаємо до групи за id
        id_groups[item_id] << item if item_id

        # Готуємо розширену структуру
        valid_items << {
          data: item,
          timestamp: timestamp
        }
      end

      # --- Крок 2: Логуємо дублікати за id ---
      id_groups.each do |item_id, group|
        next if group.length < 2
        next if @@logged_duplicate_ids.include?(item_id)

        @@logged_duplicate_ids.add(item_id)

        Jekyll.logger.warn "OwnersFilter:", "⚠️ Duplicate ID detected: #{item_id} (#{group.length} occurrences)"

        group.each do |dup|
          seller = dup["seller"]&.strip&.empty? ? nil : dup["seller"]
          phone  = dup["phone"]
          date   = dup["date"] || "(no date)"

          parts = []
          parts << "seller: '#{seller}'" if seller
          parts << "phone: #{phone}"     if phone
          info = parts.empty? ? "(no data)" : parts.join(", ")

          Jekyll.logger.info "OwnersFilter:", "  → #{info} | date: #{date}"
        end
      end

      # --- Крок 3: Сортуємо від старішого до новішого ---
      # Чим менший timestamp — тим старіший
      sorted = valid_items.sort_by { |i| i[:timestamp] }

      # --- Крок 4: Фільтрація за телефоном ---
      seen_phones = Set.new
      selected_data = []

      sorted.each do |wrapper|
        item = wrapper[:data]
        phone_raw = item["phone"]
        next unless phone_raw

        # Нормалізуємо телефон (швидкий метод)
        phone_digits = phone_raw.to_s.delete('^0-9')

        # Валідація: рівно 12 цифр, починається з 380
        next unless phone_digits.length == 12 && phone_digits.start_with?("380")

        if item["skip"]
          selected_data << item
        else
          unless seen_phones.include?(phone_digits)
            seen_phones.add(phone_digits)
            selected_data << item
          end
        end
      end

      # --- Крок 5: Фінальне сортування: новіші спочатку ---
      selected_data.sort_by do |i|
        date_str = i["date"]
        begin
          date_str ? -DateTime.parse(date_str).to_time.to_i : 0
        rescue
          0
        end
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::OwnersFilter)
