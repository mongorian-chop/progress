class StatusesController < ApplicationController
  before_filter :require_user
  before_filter :find_status, :only => [:show, :update, :destroy]

  def index
    render :json => Status.all.map(&:attributes)
  end

  def show
    render :json => @status.attributes
  end

  def create
    @status = Status.new(params[:status])
    if @status.save
      render :json => @status.attributes, :status => :created, :location => @status
    else
      render :json => @status.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @status.update_attributes(params[:status])
      head :ok
    else
      render :json => @status.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @status.destroy
      head :ok
    else
      render :json => @status.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_status
    @status = Status.find(params[:id]) if params[:id]
  end
end
