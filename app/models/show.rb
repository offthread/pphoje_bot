class Show < ActiveRecord::Base
	scope :by_date, lambda { |selectedDate| where('strftime("%d", date) = ? AND strftime("%m", date) = ? ', selectedDate.strftime("%d"), selectedDate.strftime("%m")) }
end
