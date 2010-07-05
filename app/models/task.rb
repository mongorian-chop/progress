class Task < ActiveRecord::Base
  belongs_to :user
  belongs_to :project
  belongs_to :priority
  belongs_to :status
  validates_presence_of :name, :project
  validates_length_of :name, :maximum => 255
  validates_length_of :description, :maximum => 255

  named_scope :formatted,
    :select => 'tasks.*,
      statuses.name    AS status_name,
      priorities.name  AS priority_name,
      login,
      company,
      unit,
      first_name,
      last_name',
    :joins  => [:status, :priority, :user]
end
