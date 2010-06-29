class CreateUsers < ActiveRecord::Migration
  def self.up
    create_table :users do |t|
      t.string     :login, :null => false, :limit => 16
      t.string     :crypted_password
      t.string     :password_salt
      t.string     :persistence_token

      t.belongs_to :team, :null => false
      t.string     :first_name, :null => false, :limit => 16
      t.string     :last_name, :null => false, :limit => 16
      t.string     :first_name_ruby, :limit => 16
      t.string     :last_name_ruby, :limit => 16
      t.string     :company, :limit => 255
      t.string     :unit, :limit => 255
      t.string     :email, :null => false, :limit => 255
      t.string     :phone_number, :limit => 13
      t.boolean    :admin, :null => false, :default => false

      t.timestamps
    end

    add_index :users, :login, :unique => true
    add_index :users, :email, :unique => true
  end

  def self.down
    drop_table :users
  end
end
