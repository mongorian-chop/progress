class MessagesController < ApplicationController
  def show
    path = Rails.root.join('config', 'locales', "#{params[:lang]}.yml")
    lang = YAML.load(File.open(path).read)[params[:lang]]
    render :json => lang
  end
end
