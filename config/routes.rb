ActionController::Routing::Routes.draw do |map|
  map.resources :priorities
  map.resources :statuses
  map.resources :plans
  map.resources :teams
  map.resources :users
  map.resources :projects
  map.resources :tasks
  map.resource :user_session, :only => [:new, :create, :destroy]
  map.root :controller => 'top'
  map.root_for_yahoo '/index.html', :controller => 'top'
end
