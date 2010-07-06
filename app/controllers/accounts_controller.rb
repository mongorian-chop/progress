class AccountsController < ApplicationController
  before_filter :require_user

  def show
    render :json => current_user.attributes
  end

  def create
    current_user = User.new(params[:user])
    if current_user.save
      render :json => current_user.attributes, :status => :created, :location => current_user
    else
      render :json => current_user.errors, :status => :unprocessable_entity
    end
  end

  def update
    if current_user.update_attributes(params[:user])
      head :ok
    else
      render :json => current_user.errors, :status => :unprocessable_entity
    end
  end

  def destroy
    if current_user.destroy
      head :ok
    else
      render :json => current_user.errors, :status => :unprocessable_entity
    end
  end
end
