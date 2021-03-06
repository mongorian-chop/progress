class Priority < ActiveRecord::Base
  has_many :tasks
  validates_presence_of :name
  validates_uniqueness_of :name
  validates_length_of :name, :maximum => 255

  def localize
    self.name = I18n.t(self.class.name.downcase + '.' + self.name)
    self
  end
end
