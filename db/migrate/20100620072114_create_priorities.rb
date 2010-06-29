class CreatePriorities < ActiveRecord::Migration
  def self.up
    create_table :priorities do |t|
      t.string :name, :null => false, :limit => 255
    end

    add_index :priorities, :name, :unique => true
  end

  def self.down
    drop_table :priorities
  end
end
