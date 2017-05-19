class TelegramWebhooksController < Telegram::Bot::UpdatesController
  include Telegram::Bot::UpdatesController::MessageContext
  include ApplicationHelper

  context_to_action!

  def start(*)
    # TODO: change this default message
    reply_with :message, text: t(:start_message)
  end

  def shows(*args)
    # If arguments is not empty, check if it's a number or a string
    if args.any?

      selectedDay, argsTypeErrorMessage, selectedMonth = getArgsFromCommand(*args)

      # Return immediately if an error message was caught
      if argsTypeErrorMessage
        replyWithText(argsTypeErrorMessage)
        return
      elsif not selectedDay
        replyWithText(t(:error_invalid_weekday))
        return
      end

      # Return requested info
      sendShowsInformation(selectedDay, selectedMonth)

    else
      # Ask infos about the current day
      shows(Time.zone.today.strftime("%d/%m"))
    end
  end

  def ajuda(*)
    helpMessage = t(:help_message) + t(:help_shows_tomorrow) +
    t(:help_shows_day_num) + t(:help_shows_day_str) + t(:help_support) +
    END_STREAM_STRING + t(:help_developed_by) + END_STREAM_STRING
    reply_with :message, text: helpMessage
  end

  def help(*)
    ajuda
  end

  def action_missing(action)
    replyWithText(t(:check_usage_command))
  end

  def replyWithText(text)
    respond_with :message, text: text
  end

  def action_missing(action)
    replyWithText(t(:check_usage_command))
  end

  private
  def getArgsFromCommand(*args)
    #Day informed as a number
    if args[0].match(NUMBER_REGULAR_EXPRESSION)

      dayFromArgs = args[0].to_s.rjust(2, '0')
      isCurrentMonth = false

    elsif args[0].match(DATE_REGULAR_EXPRESSION)

      dateSplitted = args[0].split('/')
      dateFormatted = Date.strptime("#{dateSplitted[0]}/#{dateSplitted[1]}/#{getCurrentYear}",
        t(:date_format))

      dayFromArgs = dateFormatted.strftime('%d')
      monthFromArgs = dateFormatted.strftime('%m')
      isCurrentMonth = false

    elsif args[0].is_a? String
      #Day informed as a string (monday, tuesday...)
      dayFromArgs = getDayFromString(args[0].to_s)
      isCurrentMonth = true

    else
      #Command does not match anything
      errorMessage = MESSAGE_CHECK_USAGE_COMMAND

    end

    if dayFromArgs.nil?
      errorMessage = t(:check_usage_command)
    elsif not errorMessage
      if isCurrentMonth
        errorMessage = validateDateFromInput(dayFromArgs.to_i, Time.zone.now.month.to_i)
      elsif not monthFromArgs
        errorMessage, monthFromArgs = getMonthIfEmptyFromArgs(dayFromArgs)
      else
        errorMessage = validateDateFromInput(dayFromArgs.to_i, monthFromArgs.to_i)
      end
    end

    return dayFromArgs, errorMessage, monthFromArgs

  end

  def getMonthIfEmptyFromArgs(dayFromArgs)
    if Time.zone.now.month.to_i < 6 || dayFromArgs.to_i < Time.zone.now.day.to_i
      monthFromArgs = Time.zone.now.month.to_i + 1
      errorMessage = validateDateFromInput(dayFromArgs.to_i, monthFromArgs)
    else
      errorMessage = validateDateFromInput(dayFromArgs.to_i, (Time.zone.now.month.to_i))
    end
    return errorMessage, monthFromArgs
  end

  def replyWithText(text)
    reply_with :message, text: text
  end

  def checkDateAvailability (endingDate, requestedDate)
    # If requested date is bigger than the end date
    if Time.zone.today > endingDate
      return t(:ended_message)
    elsif requestedDate > endingDate
    # If current date is bigger than the end date
    return t(:error_invalid_days)
  else
    return true
  end
end

def getCurrentMonth(selectedDay)

  currentMonth = Time.zone.now.strftime("%m").to_s.rjust(2, '0')
  puts currentMonth

    # If the current day is bigger than the requested day, get data from next month
    if not selectedDay
      return currentMonth
    elsif Time.zone.now.strftime("%d").to_i > selectedDay.to_i
      currentMonth = (Time.zone.now.strftime("%m").to_i + 1).to_s.rjust(2, '0')
    end

    return currentMonth
  end

  def getRequestedDateFormatted (selectedDay, selectedMonth)

    if not selectedMonth
      currentMonth = getCurrentMonth(selectedDay).to_s
    else
      currentMonth = selectedMonth.to_s
    end

    currentYear  = getCurrentYear().to_s

    return Date.parse(selectedDay + "/" + currentMonth + "/" + currentYear, t(:date_format))
  end

  def getCurrentYear
    return Time.zone.now.year.to_s
  end

  def getShowsFormatted(shows, dateFormatted)
    completedDate = "#{dateFormatted}/#{getCurrentYear}"
    weekDayNumber = Date.parse(completedDate, t(:date_format)).wday
    weekDayStr = weekDayName(weekDayNumber)

    responseMessage = t(:shows_title_message, :dateFormatted => dateFormatted, :weekDay => weekDayStr)
    shows.each do |show|
      responseMessage += t(:event_title, :eventTitle => show["name"])
      
      eventConfirmed = t(:confirmed)
      responseMessage +=  t(:event_confirmed, :eventConfirmed => eventConfirmed)
      responseMessage +=  t(:event_band_info, :moreInfo => show["videoUrl"])
    end
    responseMessage += END_STREAM_STRING

    return responseMessage
  end

  def sendShowsInformation(selectedDay, selectedMonth)
    requestedDate = getRequestedDateFormatted(selectedDay, selectedMonth)
    endingDate = Date.parse(END_DATE_STRING, t(:date_format))

    resultAvailable = checkDateAvailability(endingDate, requestedDate)

    if resultAvailable.is_a? String
      replyWithText(resultAvailable)
      return
    else
      request = Typhoeus::Request.new(
        "https://ppbot-mw.herokuapp.com/api/shows/"
      )
      dateFormatted = t(:custom_date_format, :day => requestedDate.strftime("%d"),
        :month => requestedDate.strftime("%m"))
      request.on_complete do | response |
        if response.success?
          shows = JSON.parse( response.body )

          shows.map do |x|
            x["date"] = Date.parse(x["date"], "%Y-%m-%d")
            x
          end

          shows.select {|x| x["date"] == requestedDate }

          if shows.empty?
            replyWithText(t(:empty_shows_results, :dateFormatted => dateFormatted))
          else
            responseMessage = getShowsFormatted(shows, dateFormatted)
            replyWithText( responseMessage )
          end
        else
          replyWithText( t(:error_request) )
        end
      end
      request.run
      # @shows = Show.by_date(requestedDate)

      # dateFormatted = t(:custom_date_format, :day => requestedDate.strftime("%d"),
      #   :month => requestedDate.strftime("%m"))

      # if @shows.empty?
      #   replyWithText(t(:empty_shows_results, :dateFormatted => dateFormatted))
      # else
      #   responseMessage = getShowsFormatted(@shows, dateFormatted)

      #   replyWithText(responseMessage)
      # end
    end
  end
end
