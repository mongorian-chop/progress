class StatusesController < ApplicationController
  before_filter :find_statuses, :only => [:show, :edit, :update, :destroy]
  STATUSES_PER_PAGE = 20

  def index
    @statuses = Statuses.paginate(:page => params[:page], :per_page => STATUSES_PER_PAGE)
  end

  def show
  end

  def new
    @statuses = Statuses.new
  end

  def edit
  end

  def create
    @statuses = Statuses.new(params[:statuses])
    if @statuses.save
      render :json => @statuses, :status => :created, :location => @statuses
    else
      render :json => @statuses.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @statuses.update_attributes(params[:statuses])
      head :ok
    else
      render :json => @statuses.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @statuses.destroy
      head :ok
    else
      render :json => @statuses.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_statuses
    @statuses = Statuses.find(params[:id]) if params[:id]
  end
end
