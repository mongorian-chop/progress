class TasksController < ApplicationController
  before_filter :find_task, :only => [:show, :edit, :update, :destroy]
  TASKS_PER_PAGE = 20

  def index
    @tasks = Task.paginate(:page => params[:page], :per_page => TASKS_PER_PAGE)
  end

  def show
  end

  def new
    @task = Task.new
  end

  def edit
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
