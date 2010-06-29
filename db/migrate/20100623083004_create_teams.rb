class CreateTeams < ActiveRecord::Migration
  def self.up
    create_table :teams do |t|
      t.string     :name, :null => false, :limit => 255
      t.belongs_to :plan, :null => false

      t.timestamps
    end

    add_index :teams, :name, :unique => true
  end

  def self.down
    drop_table :teams
  end
end
