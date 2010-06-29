class TeamsController < ApplicationController
  before_filter :find_team, :only => [:show, :edit, :update, :destroy]
  TEAMS_PER_PAGE = 20

  def index
    @teams = Team.paginate(:page => params[:page], :per_page => TEAMS_PER_PAGE)
  end

  def show
  end

  def new
    @team = Team.new
  end

  def edit
  end

  def create
    @team = Team.new(params[:team])
    if @team.save
      render :json => @team, :status => :created, :location => @team
    else
      render :json => @team.errors, :status => :unprocessable_entity
    end
  end

  def update
    if @team.update_attributes(params[:team])
      head :ok
    else
      render :json => @team.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if @team.destroy
      head :ok
    else
      render :json => @team.errors, :status => :unprocessable_entity
    end
  end

  private
  def find_team
    @team = Team.find(params[:id]) if params[:id]
  end
end
