ActionController::Routing::Routes.draw do |map|
  map.resources :priorities
  map.resources :statuses
  map.resources :plans
  map.resources :teams
  map.resources :users
  map.resources :projects
  map.resources :tasks
  map.resource :user_session, :only => [:new, :create, :destroy]
  map.login 'login', :controller => 'user_sessions', :action => 'new'
  map.logout 'logout', :controller => 'user_sessions', :action => 'destroy'
  map.signup 'signup', :controller => 'signup', :action => 'new', :conditions => {:method => :get}
  map.signup 'signup', :controller => 'signup', :action => 'create', :conditions => {:method => :post}
  map.root :controller => 'top'
  map.root_for_yahoo '/index.html', :controller => 'top'
end
