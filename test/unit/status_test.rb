require 'test_helper'

class StatusTest < Test::Unit::TestCase
  should have_many(:tasks)
  should validate_presence_of(:name)
  should validate_uniqueness_of(:name)
  should ensure_length_of(:name).is_at_most(255)
end
