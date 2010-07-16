class Dependence < ActiveRecord::Base
  belongs_to :source,      :foreign_key => 'source_id',      :class_name => 'Task'
  belongs_to :destination, :foreign_key => 'destination_id', :class_name => 'Task'
end
