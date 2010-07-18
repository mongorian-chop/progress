class TopController < ApplicationController
  def index
    if logged_in?
      render :chart, :layout => 'chart'
    else
      render :index
    end
  end
end
