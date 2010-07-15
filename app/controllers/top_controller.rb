class TopController < ApplicationController
  before_filter :require_user, :only => [:chart]

  def index
  end

  def chart
    render 'chart', :layout => 'chart'
  end
end
