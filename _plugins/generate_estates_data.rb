# _plugins/generate_estates_data.rb

require 'json'

Jekyll::Hooks.register :site, :post_read do |site|
  to_string = ->(val) { val.nil? || val == "" ? "" : val.to_s }

  raw_offers = site.posts.docs.select do |post|
    !post.data['hidden'] &&
    !post.url.include?('/news/') &&
    !post.url.include?('/articles/')
  end

  uid_set = Set.new
  duplicate_uids = Set.new
  raw_offers.each do |offer|
    uid = to_string[offer.data['uid']]
    next if uid == ""
    if uid_set.include?(uid)
      duplicate_uids << uid
    else
      uid_set << uid
    end
  end

  if !duplicate_uids.empty?
    Jekyll.logger.warn "Estates", "⚠️ #{duplicate_uids.size} duplicate uid(s) detected (all included in output)"
  end

  image_map = {}
  site.static_files.each do |file|
    next unless file.path.start_with?('/assets/images/') && [".jpg", ".jpeg"].include?(file.extname.downcase)
    web_path = file.path.gsub('\\', '/')
    image_map[web_path] = web_path
  end

  phone_groups = {}
  raw_offers.each do |offer|
    phone = to_string[offer.data['phone']]
    next if phone == ""
    (phone_groups[phone] ||= []) << offer
  end

  selected_offers = []

  phone_groups.each do |phone, group|
    with_skip = group.select { |o| o.data['skip'] == true }
    without_skip = group - with_skip

    if with_skip.any?
      selected_offers.concat(with_skip)
      if without_skip.any?
        oldest = without_skip.min_by { |o| o.date || Time.at(0) }
        selected_offers << oldest
      end
    else
      oldest = group.min_by { |o| o.date || Time.at(0) }
      selected_offers << oldest if oldest
    end
  end

  site_time = site.time
  cdate_ymd = site_time.strftime('%Y%m%d')
  cdate_iso = site_time.strftime('%Y-%m-%dT00:00:00.000Z')

  result = selected_offers.map do |offer|
    offer_date = offer.date
    date_ymd = offer_date&.strftime('%Y%m%d')
    display_date = if date_ymd && date_ymd > cdate_ymd
      cdate_iso
    elsif offer_date
      offer_date.strftime('%Y-%m-%dT00:00:00.000Z')
    else
      ""
    end

    region = to_string[offer.data['region']]
    district = region.sub('кий район', 'кому районі')

    phone = to_string[offer.data['phone']]
    uid = to_string[offer.data['uid']]
    images = []

    if phone != "" && uid != ""
      base_path = "/assets/images/#{phone}/#{uid}/"
      site.static_files.each do |file|
        next unless file.path.start_with?(base_path) && [".jpg", ".jpeg"].include?(file.extname.downcase)
        web_path = file.path.gsub('\\', '/')
        images << { "src" => web_path }
        break if images.size >= 4
      end
    end

    if images.empty? && uid != ""
      fallback_path = "/assets/images/re/#{uid}.jpg"
      if image_map.key?(fallback_path)
        images << { "src" => fallback_path }
      end
    end

    if images.any?
      uk = site.data['uk'] || {}
      images = images.map do |img|
        alt = "#{to_string[offer.data['type']]} #{to_string[uk['re_in']]} #{to_string[offer.data['location']]}#{district}"
        address = to_string[offer.data['address']]
        title_part = address.include?(to_string[uk['re_vul']]) ?
          "#{to_string[uk['re_po']]} #{address}" :
          "#{to_string[uk['re_at']]} #{address}"
        title = "#{to_string[offer.data['type']]} #{title_part} #{to_string[uk['re_in']]} #{to_string[offer.data['location']]}#{district}"

        { "src" => img["src"], "alt" => alt, "title" => title }
      end
    end

    item = {
      "id" => uid,
      "type" => to_string[offer.data['type']],
      "page" => to_string[offer.data['page']],
      "rent" => to_string[offer.data['rent']],
      "rooms" => to_string[offer.data['rooms']],
      "surface" => to_string[offer.data['surface']],
      "surface_land" => to_string[offer.data['surface_land']],
      "price" => to_string[offer.data['price']],
      "price_sqmt" => to_string[offer.data['price_sqmt']],
      "floor" => to_string[offer.data['floor']],
      "floors" => to_string[offer.data['floors']],
      "parking" => to_string[offer.data['parking']],
      "region" => region,
      "location" => to_string[offer.data['location']],
      "address" => to_string[offer.data['address']],
      "object" => to_string[offer.data['object']],
      "coordinates" => to_string[offer.data['coordinates']],
      "date" => display_date,
      "seller" => to_string[offer.data['seller']],
      "phone" => phone,
      "description" => to_string[offer.data['description']],
      "link" => (offer.data['page'] == 1 ? "" : offer.url)
    }

    if offer.data.key?('skip')
      item["skip"] = offer.data['skip'] ? "true" : "false"
    end

    item["images"] = images.empty? ? "" : images
    item
  end

  site.data['estates'] = result
  Jekyll.logger.info "Estates:", "✓ Generated #{result.size} offers (optimized, production-ready)"
end