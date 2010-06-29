class ProjectsController < ApplicationController
  before_filter :find_project, :only => [:show, :edit, :update, :destroy]
  PROJECTS_PER_PAGE = 20

  def index
    @projects = Project.paginate(:page => params[:page], :per_page => PROJECTS_PER_PAGE)
  end

  def show
  end

  def new
    @project = Project.new
  end

  def edit
  end

  def create
    @project = Project.new(params[:project])
    if @project.save
      render :json => @project, :status => :created, :location => @project
    else
      render :json => @project.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @project.update_attributes(params[:project])
      head :ok
    else
      render :json => @project.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @project.destroy
      head :ok
    else
      render :json => @project.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_project
    @project = Project.find(params[:id]) if params[:id]
  end
end
