require 'test_helper'

class TaskTest < Test::Unit::TestCase
  should belong_to :user
  should belong_to :project
  should belong_to :priority
  should belong_to :status
  should validate_presence_of(:name)
  should validate_presence_of(:project) 
  should ensure_length_of(:name).is_at_most(255)
  should ensure_length_of(:description).is_at_most(255)
end
