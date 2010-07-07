module Extensions
  module Search
    def self.included(base)
      base.class_eval do
        named_scope :order_by, lambda {|column, order| {
          :order => "#{(column ? column : 'id')} #{(order ? order : 'ASC')}"
        }}
      end
    end
  end
end
