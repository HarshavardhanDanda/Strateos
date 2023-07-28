class Category < ApplicationRecord
  has_snowflake_id('cat')
  has_and_belongs_to_many :kits
  has_many :category_materials
  has_many :materials, :through => :category_materials

  validates :path, length: { minimum: 1 }

  def self.for_path(path)
    # I'm not entirely sure what the purpose of the code is below but it seems
    # to be a limitation of Rails finding via strings

    # rubocop:disable Style/StringConcatenation
    find_by path: '{' + path.to_a.map { |x| '"' + x.to_s.gsub(/\\/, '\\\\').gsub(/"/, "\\\"") + '"' }.join(',') + '}'
    # rubocop:enable Style/StringConcatenation
  end
end
