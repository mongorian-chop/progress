class UsersController < ApplicationController
  before_filter :find_user, :only => [:index, :show, :update, :destroy]

  def index
    render :json => User.all.map(&:attributes)
  end

  def show
    render :json => @user.attributes
  end

  def create
    @user = User.new(params[:user])
    if @user.save
      flash[:notice] = t('User was successfully created')
      redirect_to @user
    else
      render :action => :new
    end
  end

  def update
    if @user.update_attributes(params[:user])
      flash[:notice] = t('User was successfully updated')
      redirect_to @user
    else
      render :action => :edit
    end
  end

  def destroy
    if @user.destroy
      flash[:notice] = t('User was successfully deleted')
      redirect_to users_path
    else
      flash[:notice] = t('User was not deleted')
      redirect_to @user
    end
  end

  private
  def find_user
    @user = User.find(params[:id]) if params[:id]
  end
end
