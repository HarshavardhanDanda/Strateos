module CountryService
  module_function

  def country_data
    results = {}

    ISO3166::Country.all do |country_code, data|
      country_name = data['name']
      subdivisions = (ISO3166::Country.new(data).subdivisions.keys || [])

      results[country_code] = {
        name: country_name,
        value: country_code,
        subdivisions: subdivisions
      }
    end

    # Use United Kingdom instead of ISO name since xero limits countries to 50 chars.
    results["GB"][:name] = "United Kingdom"

    results
  end

  # Memoized data
  COUNTRY_DATA = country_data
end
