class SignupController < ApplicationController
  def new
    @user_session = UserSession.new
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
