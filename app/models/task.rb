class Task < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  belongs_to :priority
  belongs_to :status
  validates_presence_of :name, :project
  validates_length_of :name, :maximum => 255
  validates_length_of :description, :maximum => 255

  named_scope :order_by, lambda {|column, order|
    {:order => "#{(column ? column : 'id')} #{(order ? order : 'ASC')}"}}

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

  def self.jsonize(project = nil, sort = 'id', order = 'ASC')
    (project ? project.tasks : Task).with_properties.order_by(sort, order).map do |task|
      Task.localize(task.attributes)
    end
  end

  def self.localize(hash)
    hash['priority_name'] = I18n.t("priority.#{hash['priority_name']}") if hash['priority_name']
    hash['status_name'] = I18n.t("status.#{hash['status_name']}") if hash['status_name']
    hash
  end
end
