class Plan < ActiveRecord::Base
  has_many :teams
  validates_presence_of :name
  validates_presence_of :max
  validates_presence_of :price
  validates_uniqueness_of :name
  validates_length_of :name, :maximum => 255
  validates_numericality_of :max, :less_than_or_equal_to => 65535
  validates_numericality_of :price
end
