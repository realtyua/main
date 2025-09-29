# _plugins/owners_filter.rb

require 'set'

module Jekyll
  module OwnersFilter
    def unique_owners_with_phone(items)
      # Фільтруємо hidden == true
      filtered = items.reject { |i| i["hidden"] == true }

      # Сортуємо за датою: новіші спочатку
      sorted = filtered.sort_by do |i|
        time = i["date"] ? DateTime.parse(i["date"]) : DateTime.new(0)
        -time.to_time.to_i
      rescue
        0
      end

      seen_phones = Set.new
      result = []

      sorted.each do |item|
        phone = item["phone"]

        # Перетворюємо в рядок і залишаємо тільки цифри
        phone_digits = phone ? phone.to_s.gsub(/[^0-9]/, '') : ""

        # Валідація 1: рівно 12 цифр
        unless phone_digits.length == 12
          Jekyll.logger.warn "OwnersFilter:", "Phone must be exactly 12 digits (got #{phone_digits.length}): #{phone.inspect} for '#{item['title']&.inspect || '(no title)'}'"
          next
        end

        # Валідація 2: має починатися з "380"
        unless phone_digits.start_with?("380")
          Jekyll.logger.warn "OwnersFilter:", "Phone must start with '380' (Ukraine): #{phone.inspect} → #{phone_digits} for '#{item['title']&.inspect || '(no title)'}'"
          next
        end

        # Тепер номер валідний: 12 цифр, починається з 380
        if item["skip"]
          result << item
        else
          unless seen_phones.include?(phone_digits)
            seen_phones.add(phone_digits)
            result << item
          end
        end
      end

      result
    end
  end
end

Liquid::Template.register_filter(Jekyll::OwnersFilter)
