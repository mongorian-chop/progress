require 'test_helper'

class ProjectTest < Test::Unit::TestCase
  should belong_to(:team)
  should have_many(:tasks).dependent(:destroy)
  should validate_presence_of(:team)
  should validate_presence_of(:name)
  should ensure_length_of(:name).is_at_most(255)
end
