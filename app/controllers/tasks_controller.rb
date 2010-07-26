class TasksController < ApplicationController
  before_filter :require_user
  before_filter :find_task, :only => [:show, :update, :destroy]
  before_filter :find_project, :only => [:index]

  def index
    projects =
      if @project
        Task.by_project_id(@project.id).with_properties
      else
        ids = current_user.team.projects.map(&:id)
        logger.debug "ids: #{ids}"
        Task.by_project_ids(ids).with_properties
      end
    logger.debug "projects: #{projects}"

    render :json => projects.map {|o| o.localize.attributes }
  end

  def show
    render :json => @task.localize.attributes
  end

  def create
    @task = Task.new(params[:task])
    if @task.save
      render :json => @task.attributes, :status => :created, :location => @task
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

  def find_project
    @project = params[:project_id] ? Project.find(params[:project_id]) : nil
  end
end
