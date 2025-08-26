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
        -time.to_time.to_i  # мінус — щоб новіші були першими
      rescue
        0
      end

      seen_phones = Set.new
      result = []

      sorted.each do |item|
        phone = item["phone"]
        next unless phone && !phone.strip.empty?

        if item["skip"]
          # Якщо skip: true — додаємо, але не блокуємо інших
          result << item
        else
          # Якщо не skip — додаємо тільки якщо телефон ще не було
          unless seen_phones.include?(phone)
            seen_phones.add(phone)
            result << item
          end
        end
      end

      result
    end
  end
end

Liquid::Template.register_filter(Jekyll::OwnersFilter)
