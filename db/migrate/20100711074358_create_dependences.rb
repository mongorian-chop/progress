class CreateDependences < ActiveRecord::Migration
  def self.up
    create_table :dependences do |t|
      t.integer :source_id,      :null => false
      t.integer :destination_id, :null => false
    end
  end

  def self.down
    drop_table :dependences
  end
end
