class Project < ActiveRecord::Base
  belongs_to :team
  has_many :tasks, :dependent => :destroy
  validates_presence_of :team, :name
  validates_length_of :name, :maximum => 255
end
