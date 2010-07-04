require 'test_helper'

class BrowseTest < ActionController::IntegrationTest
  fixtures :all

  should_respond_with_path 302, '/priorities'
  should_respond_with_path 302, '/priorities/1'
  should_respond_with_path 302, '/statuses'
  should_respond_with_path 302, '/statuses/1'
  should_respond_with_path 302, '/plans'
  should_respond_with_path 302, '/plans/1'
  should_respond_with_path 302, '/teams'
  should_respond_with_path 302, '/teams/1'
  should_respond_with_path 302, '/users'
  should_respond_with_path 302, '/users/1'
  should_respond_with_path 302, '/projects'
  should_respond_with_path 302, '/projects/1'
  should_respond_with_path 302, '/tasks'
  should_respond_with_path 302, '/tasks/1'
  should_respond_with_path :success, '/login'
  should_respond_with_path 302, '/logout'
  should_respond_with_path :success, '/signup'
  should_respond_with_path 302, '/'
  should_respond_with_path 302, '/index.html'
end
