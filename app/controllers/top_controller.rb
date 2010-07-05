class TopController < ApplicationController
  before_filter :require_user
  layout 'chart'

  def index
  end
end
