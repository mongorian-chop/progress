class SignupController < ApplicationController
  def new
    @team = Team.new
    @team.users.build(:admin => true)
  end

  def create
    @team = Team.new(params[:team])
    if @team.save
      flash[:notice] = t('Signup successfully')
      redirect_to root_url
    else
      render :action => :new
    end
  end
end
