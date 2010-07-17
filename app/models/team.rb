class Team < ActiveRecord::Base
  belongs_to :plan
  has_many :users,    :dependent => :destroy
  has_many :projects, :dependent => :destroy
  accepts_nested_attributes_for :users
  validates_presence_of :name, :plan
  validates_length_of :name, :maximum => 255
end
