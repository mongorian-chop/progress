ActionController::Routing::Routes.draw do |map|
  map.resources :priorities, :except => [:new, :edit]
  map.resources :statuses, :except => [:new, :edit]
  map.resources :plans, :except => [:new, :edit]
  map.resources :teams, :except => [:new, :edit]
  map.resources :users, :except => [:new, :edit]
  map.resource  :account, :except => [:new, :edit]
  map.resources :tasks, :except => [:new, :edit]
  map.resources :projects, :except => [:new, :edit] do |project|
    project.resources :tasks, :except => [:new, :edit]
  end
  map.resources :projects, :has_many => :tasks, :except => [:new, :edit]
  map.resource  :user_session, :only => [:new, :create, :destroy]
  map.login    'login', :controller => 'user_sessions', :action => 'new'
  map.logout   'logout', :controller => 'user_sessions', :action => 'destroy'
  map.signup   'signup', :controller => 'signup', :action => 'new', :conditions => {:method => :get}
  map.signup   'signup', :controller => 'signup', :action => 'create', :conditions => {:method => :post}
  map.messages '/javascripts/messages/:lang.js', :controller => 'messages', :action => 'show'
  map.root :controller => 'top'
  map.root_for_yahoo '/index.html', :controller => 'top'
end
