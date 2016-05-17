module ApplicationHelper

	NUM_WEEK_DAYS = 7
	MESSAGE_CHECK_USAGE_COMMAND = I18n.t(:check_usage_command)
	NUMBER_REGULAR_EXPRESSION = /^-?[0-9]+$/
	END_DATE_STRING = "17/05/2016"

	def getDayFromString (day)
		currentWeekDay = Date.today.wday

		weekDayRequested = 1

		case day
		when t(:week_day_monday)
			weekDayRequested = daysBefore(currentWeekDay, 1)
		when t(:week_day_tuesday)
			weekDayRequested = daysBefore(currentWeekDay, 2)
		when t(:week_day_wednesday)
			weekDayRequested = daysBefore(currentWeekDay, 3)
		when t(:week_day_thursday)
			weekDayRequested = daysBefore(currentWeekDay, 4)
		when t(:week_day_friday)
			weekDayRequested = daysBefore(currentWeekDay, 5)
		when t(:week_day_saturday)
			weekDayRequested = daysBefore(currentWeekDay, 6)
		when t(:week_day_sunday)
			weekDayRequested = daysBefore(currentWeekDay, 0)
		when t(:week_day_tomorrow)
			weekDayRequested = 1
		else
			weekDayRequested = Date.today.wday
		end

		dateRequested = Date.today() + weekDayRequested.to_i
		dayRequested = dateRequested.strftime("%d")

		return dayRequested
	end

	def daysBefore(currentWeekDay, askedWeekDay)
		difference = askedWeekDay - currentWeekDay
		if difference < 0
			return (difference) + NUM_WEEK_DAYS
		end
		return difference
	end

	def validateDayFromMonth(day)
		if day > 30 || day < 1
			return I18n.t(:error_invalid_days)
		end
	end
end