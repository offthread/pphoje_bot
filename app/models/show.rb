class Show < ActiveRecord::Base
	scope :by_day, lambda { |day| where('strftime("%d", data) = ?', day) }
end
