class CreatePlans < ActiveRecord::Migration
  def self.up
    create_table :plans do |t|
      t.string  :name, :null => false, :limit => 255
      t.integer :max, :null => false, :limit => 65535
      t.integer :price, :null => false
    end

    add_index :plans, :name, :unique => true
  end

  def self.down
    drop_table :plans
  end
end
