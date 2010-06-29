class PrioritiesController < ApplicationController
  before_filter :find_priority, :only => [:show, :update, :destroy]

  def index
    render :json => Priority.all
  end

  def show
    render :json => @priority
  end

  def create
    @priority = Priority.new(params[:priority])
    if @priority.save
      render :json => @priority, :status => :created, :location => @priority
    else
      render :json => @priority.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @priority.update_attributes(params[:priority])
      head :ok
    else
      render :json => @priority.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @priority.destroy
      head :ok
    else
      render :json => @priority.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_priority
    @priority = Priority.find(params[:id]) if params[:id]
  end
end
