class Init < ActiveRecord::Migration
  # Create Table All
  #
  def self.up
    # Priorities::priority
    create_table :priorities do |t|
      t.string    :name,          :null => false
      t.integer   :display_order, :null => false, :uniq => true
      t.datetime  :created,       :null => false
      t.datetime  :modified,      :null => false
      t.integer   :deleted,       :null => false
      t.datetime  :deleted_date
    end

    load_fixture :priorities

    # Statuses::status
    create_table :statuses do |t|
      t.string    :name,          :null => false
      t.integer   :display_order, :null => false, :uniq => true
      t.datetime  :created,       :null => false
      t.datetime  :modified,      :null => false
      t.integer   :deleted,       :null => false
      t.datetime  :deleted_date
    end

    load_fixture :statuses

    # Users::user
    create_table :users do |t|
      t.string      :corporation,       :null => false
      t.string      :name,              :null => false
      t.string      :name_ruby
      t.string      :mail_address,      :null => false
      t.string      :password,          :null => false
      t.string      :tel, :limit => 13
      t.string      :unit
      t.integer     :admin,             :null => false
      t.datetime    :created,           :null => false
      t.datetime    :modified,          :null => false
      t.integer     :deleted,           :null => false
      t.datetime    :deleted_date
    end

    load_fixture :users


    # Projects::project
    create_table :projects do |t|
      t.string      :title,         :null => false
      t.string      :description,   :null => false
      t.date        :start_dt,       :null => false
      t.date        :end_dt,         :null => false
      t.references  :user
      t.datetime    :created,       :null => false
      t.datetime    :modified,      :null => false
      t.integer     :deleted,       :null => false
      t.datetime    :deleted_date
    end

    add_index :projects, :user_id
    add_foreign_key :projects, :user_id,  :users

  load_fixture :projects

    # Tasks::task
    create_table :tasks do |t|
      t.string      :title,         :null => false
      t.string      :description,   :null => false
      t.date        :start_dt,       :null => false
      t.date        :end_dt,         :null => false
      t.references  :project
      t.references  :priority
      t.references  :user
      t.references  :status
      t.datetime    :created,       :null => false
      t.datetime    :modified,      :null => false
      t.integer     :deleted,       :null => false
      t.datetime    :deleted_date
    end

    add_index :tasks, :project_id
    add_index :tasks, :priority_id
    add_index :tasks, :user_id
    add_index :tasks, :status_id
    add_foreign_key :tasks, :project_id,  :projects
    add_foreign_key :tasks, :priority_id, :priorities
    add_foreign_key :tasks, :user_id,     :users
    add_foreign_key :tasks, :status_id,   :statuses

    load_fixture :tasks

  end

  def self.down
    remove_foreign_key :tasks,    :project_id,  :projects
    remove_foreign_key :tasks,    :priority_id, :priorities
    remove_foreign_key :tasks,    :user_id,     :users
    remove_foreign_key :tasks,    :status_id,   :statuses
    remove_foreign_key :projects, :user_id,     :users

    drop_table :tasks
    drop_table :projects
    drop_table :users
    drop_table :statuses
    drop_table :priorities
  end
end

