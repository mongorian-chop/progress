class Task < ActiveRecord::Base
  include Extensions::Search
  belongs_to :user
  belongs_to :project
  belongs_to :priority
  belongs_to :status
  has_many :tasks_as_source,       :foreign_key => 'source_id',      :class_name => 'Dependence'
  has_many :tasks_as_destinations, :foreign_key => 'destination_id', :class_name => 'Dependence'
  has_many :sources,      :through => :tasks_as_destination
  has_many :destications, :through => :tasks_as_source
  validates_presence_of :name, :project
  validates_length_of   :name, :maximum => 255
  validates_length_of   :description, :maximum => 255

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

  named_scope :by_project_ids, lambda {|ids|
    {:conditions => ['tasks.project_id IN (?)', ids]}}

  def localize
    self.priority_name = I18n.t("priority.#{self.priority_name}") if self.respond_to?(:priority_name)
    self.status_name = I18n.t("status.#{self.status_name}") if self.respond_to?(:status_name)
    self
  end

  def end_on
    start_on + days
  end
end
