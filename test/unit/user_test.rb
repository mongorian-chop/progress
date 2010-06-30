require 'test_helper'

class UserTest < Test::Unit::TestCase
  should belong_to(:team)
  should have_many(:tasks)
  should validate_presence_of(:team)
  should validate_presence_of(:first_name)
  should validate_presence_of(:last_name)
  should validate_presence_of(:email)
  should validate_presence_of(:admin)
  should ensure_length_of(:first_name).is_at_most(16)
  should ensure_length_of(:last_name).is_at_most(16)
  should ensure_length_of(:first_name_ruby).is_at_most(16)
  should ensure_length_of(:last_name_ruby).is_at_most(16)
  should ensure_length_of(:company).is_at_most(255)
  should ensure_length_of(:unit).is_at_most(255)
  should ensure_length_of(:email).is_at_most(255)
  should ensure_length_of(:phone_number).is_at_most(13)
end
