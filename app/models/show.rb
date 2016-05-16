class Show < ActiveRecord::Base
	scope :by_day, lambda { |day, month| where('strftime("%d", data) = ? AND strftime("%m", data) = ? ', day, month) }
end
