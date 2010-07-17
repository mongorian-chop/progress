class MessagesController < ApplicationController
  def show
    path = Rails.root.join('config', 'locales', "#{params[:lang]}.yml")
    lang = YAML.load(File.open(path).read)[params[:lang].to_s]
    render :js => "L = #{lang.to_json}"
  end
end
