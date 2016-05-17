class Show < ActiveRecord::Base
	scope :by_day, lambda { |day, month| where('strftime("%d", date) = ? AND strftime("%m", date) = ? ', day, month) }
end
