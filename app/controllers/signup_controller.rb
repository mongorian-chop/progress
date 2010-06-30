class SignupController < ApplicationController
  def new
    @team = Team.new
    @team.users.build
  end

  def create
    @user = User.new(params[:user])
    if @user.save
      flash[:notice] = t('Signup successfully')
      redirect_to root_url
    else
      render :action => :new
    end
  end
end
