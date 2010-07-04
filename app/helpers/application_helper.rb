module ApplicationHelper
  def select_by_model(object, method)
    select object.class.name.downcase, method, build_model_list(method),
      :selected => object.send(method.to_s)
  end

  private
  def build_model_list(method)
    default = [[t('Please select'), '']]
    str = method.to_s.humanize
    list = str.
           constantize.
           all.
           collect {|e| [t("#{str.downcase}.#{e.name}"), e.id] }
    default + list.sort {|a, b| a[1] <=> b[1] }
  end
end
