class CreateStatuses < ActiveRecord::Migration
  def self.up
    create_table :statuses do |t|
      t.string :name, :null => false, :limit => 255
    end

    add_index :statuses, :name, :unique => true
  end

  def self.down
    drop_table :statuses
  end
end
