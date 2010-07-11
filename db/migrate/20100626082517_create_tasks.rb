class CreateTasks < ActiveRecord::Migration
  def self.up
    create_table :tasks do |t|
      t.string     :name, :null => false, :limit => 255
      t.string     :description, :limit => 255
      t.date       :start_on, :null => false
      t.integer    :days, :null => false, :default => 1
      t.belongs_to :user
      t.belongs_to :project, :null => false
      t.belongs_to :priority
      t.belongs_to :status

      t.timestamps
    end
  end

  def self.down
    drop_table :tasks
  end
end
