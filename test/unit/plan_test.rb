require 'test_helper'

class PlanTest < Test::Unit::TestCase
  should have_many(:teams)
  should validate_presence_of(:name)
  should validate_presence_of(:max)
  should validate_presence_of(:price)
  should validate_uniqueness_of(:name)
  should ensure_length_of(:name).is_at_most(255)
  should validate_numericality_of(:max)
  should validate_numericality_of(:price)
end
