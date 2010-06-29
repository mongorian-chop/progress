def load_fixture(fixture, dir = "db/seeds")
  puts "loading #{fixture} ..."
  require 'active_record/fixtures'
  Fixtures.create_fixtures(dir, fixture)
end

load_fixture :priorities
load_fixture :statuses
load_fixture :plans
load_fixture :teams
load_fixture :users
load_fixture :projects
load_fixture :tasks
