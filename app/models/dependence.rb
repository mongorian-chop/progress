class Dependence < ActiveRecord::Base
  belongs_to :source, :foreign_key => 'source_id', :class_name => 'Task' 
  belongs_to :sink,   :foreign_key => 'sink_id',   :class_name => 'Task' 
end
