module ActiveRecord::ConnectionAdapters::SchemaStatements
 # options => {
 #   :on_update => :cascade,
 #   :on_delete => :cascade}
 def add_foreign_key(from_table, from_column, to_table, options = {})
   constraint_name = "fk_#{from_table}_#{to_table}"
   sql = "ALTER TABLE #{from_table} ADD CONSTRAINT" +
     " #{constraint_name} FOREIGN KEY (#{from_column}) REFERENCES #{to_table}(id)"

   if options[:on_update].present?
     sql += " ON UPDATE #{options[:on_update].to_s.upcase}"
   end

   if options[:on_delete].present?
     sql += " ON DELETE #{options[:on_delete].to_s.upcase}"
   end
   execute sql
 end

 def remove_foreign_key(from_table, from_column, to_table)
   constraint_name = "fk_#{from_table}_#{to_table}"
   execute "ALTER TABLE #{from_table} DROP FOREIGN KEY #{constraint_name}"
 end

 def set_auto_increment(table_name, number)
   execute "ALTER TABLE #{quote_table_name(table_name)} AUTO_INCREMENT=#{number}"
 end

 def load_fixture(fixture, dir = "db/data")
   require 'active_record/fixtures'
   Fixtures.create_fixtures(dir, fixture)
 end
end
