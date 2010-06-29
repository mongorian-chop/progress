class PlansController < ApplicationController
  before_filter :find_plan, :only => [:show, :edit, :update, :destroy]
  PLANS_PER_PAGE = 20

  def index
    @plans = Plan.paginate(:page => params[:page], :per_page => PLANS_PER_PAGE)
  end

  def show
  end

  def new
    @plan = Plan.new
  end

  def edit
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
