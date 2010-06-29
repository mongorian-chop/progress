class TeamsController < ApplicationController
  before_filter :require_user
  before_filter :find_team, :only => [:show, :update, :destroy]

  def index
    render :json => Team.all
  end

  def show
    render :json => @team
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
