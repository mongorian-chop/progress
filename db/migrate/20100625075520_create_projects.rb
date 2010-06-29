class CreateProjects < ActiveRecord::Migration
  def self.up
    create_table :projects do |t|
      t.belongs_to :team, :null => false
      t.string     :name, :null => false, :limit => 255
      t.string     :description, :limit => 255
      t.date       :start_on
      t.date       :end_on

      t.timestamps
    end
  end

  def self.down
    drop_table :projects
  end
end
