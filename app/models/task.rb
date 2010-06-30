class Task < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  belongs_to :priority
  belongs_to :status
  validates_presence_of :name, :project
  validates_length_of :name, :maximum => 255
  validates_length_of :description, :maximum => 255
end
