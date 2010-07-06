class Task < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  belongs_to :priority
  belongs_to :status
  validates_presence_of :name, :project
  validates_length_of :name, :maximum => 255
  validates_length_of :description, :maximum => 255

  named_scope :order_by, lambda {|column, order| {:order => "#{column} #{(order ? order : 'ASC')}"} }

  named_scope :with_properties,
    :select => 'tasks.*,
      priorities.name  AS priority_name,
      statuses.name    AS status_name,
      login,
      company,
      unit,
      first_name,
      last_name',
    :joins  => [:status, :priority, :user]

  def self.jsonize(project = nil)
    (project ? project.tasks : Task).with_properties.map do |task|
      task.localize.attributes
    end
  end

  def localize
    self.priority_name = I18n.t("priority.#{self.priority_name}") if self.priority_name
    self.status_name = I18n.t("status.#{self.status_name}") if self.status_name
    self
  end
end
