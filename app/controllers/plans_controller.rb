class PlansController < ApplicationController
  before_filter :require_user
  before_filter :find_plan, :only => [:show, :update, :destroy]

  def index
    render :json => Plan.all
  end

  def show
    render :json => @plan
  end

  def create
    @plan = Plan.new(params[:plan])
    if @plan.save
      render :json => @plan, :status => :created, :location => @plan
    else
      render :json => @plan.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @plan.update_attributes(params[:plan])
      head :ok
    else
      render :json => @plan.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @plan.destroy
      head :ok
    else
      render :json => @plan.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_plan
    @plan = Plan.find(params[:id]) if params[:id]
  end
end
