class User < ActiveRecord::Base
  acts_as_authentic
  belongs_to :team
  has_many :tasks
  validates_presence_of :first_name, :last_name, :email, :admin
  validates_length_of :first_name, :maximum => 16
  validates_length_of :last_name, :maximum => 16
  validates_length_of :first_name_ruby, :maximum => 16, :allow_nil => true
  validates_length_of :last_name_ruby, :maximum => 16, :allow_nil => true
  validates_length_of :company, :maximum => 255, :allow_nil => true
  validates_length_of :unit, :maximum => 255, :allow_nil => true
  validates_length_of :email, :maximum => 255
  validates_length_of :phone_number, :maximum => 13, :allow_nil => true
end
