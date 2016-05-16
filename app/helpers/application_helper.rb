module ApplicationHelper

	NUM_WEEK_DAYS = 7
	MESSAGE_CHECK_USAGE_COMMAND = "Verifique as instruções de uso utilizando o comando /help"
	NUMBER_REGULAR_EXPRESSION = /^-?[0-9]+$/

	def getDayFromString (day)
		currentWeekDay = Date.today.wday

		weekDayRequested = 1

		case day
		when "segunda"
			weekDayRequested = daysBefore(currentWeekDay, 1)
		when "terca"
			weekDayRequested = daysBefore(currentWeekDay, 2)
		when "quarta"
			weekDayRequested = daysBefore(currentWeekDay, 3)
		when "quinta"
			weekDayRequested = daysBefore(currentWeekDay, 4)
		when "sexta"
			weekDayRequested = daysBefore(currentWeekDay, 5)
		when "sabado", "sábado"
			weekDayRequested = daysBefore(currentWeekDay, 6)
		when "domingo"
			weekDayRequested = daysBefore(currentWeekDay, 0)
		when "amanhã", "amanha"
			weekDayRequested = 1
		else
			weekDayRequested = Date.today.wday
		end

		dateRequested = Date.today() + weekDayRequested.to_i
		dayRequested = dateRequested.strftime("%d")

		puts "Day Requested " + dayRequested.to_s
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
			puts "Estou aqui"
			return "O Maior São João do Mundo acontece de 03 de Junho a 03 de Julho. Informe um dia válido para obter maiores informações."
		end
	end
end