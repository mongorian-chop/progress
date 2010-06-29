class TasksController < ApplicationController
  before_filter :find_task, :only => [:show, :update, :destroy]

  def index
    render :json => Task.all
  end

  def show
    render :json => @task
  end

  def create
    @task = Task.new(params[:task])
    if @task.save
      render :json => @task, :status => :created, :location => @task
    else
      render :json => @task.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @task.update_attributes(params[:task])
      head :ok
    else
      render :json => @task.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @task.destroy
      head :ok
    else
      render :json => @task.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_task
    @task = Task.find(params[:id]) if params[:id]
  end
end
