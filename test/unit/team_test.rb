require 'test_helper'

class TeamTest < Test::Unit::TestCase
  should belong_to(:plan)
  should have_many(:users).dependent(:destroy)
  should validate_presence_of(:name)
  should validate_presence_of(:plan)
  should ensure_length_of(:name).is_at_most(255)
end
