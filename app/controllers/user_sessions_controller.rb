class UserSessionsController < ApplicationController
  before_filter :require_user, :only => [:destroy]

  def new
    @user_session = UserSession.new
  end

  def create
    @user_session = UserSession.new(params[:user_session])
    if @user_session.save
      flash[:notice] = t('Logged in successfully')
      redirect_to root_url
    else
      flash[:notice] = t('Logged in failed')
      render :action => :new
    end
  end

  def destroy
    current_user_session.destroy
    flash[:notice] = t('You have been logged out')
    redirect_to root_url
  end
end
