class Team < ActiveRecord::Base
  belongs_to :plan
  has_many :users, :dependent => :destroy
  accepts_nested_attributes_for :users
end
