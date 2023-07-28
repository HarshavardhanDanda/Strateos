class CategoryMaterial < ApplicationRecord
  self.table_name = :categories_materials

  belongs_to :material
  belongs_to :category

  validates_presence_of :material
  validates_presence_of :category
end
