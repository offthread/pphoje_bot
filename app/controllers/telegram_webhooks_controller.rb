class TelegramWebhooksController < Telegram::Bot::UpdatesController
  include Telegram::Bot::UpdatesController::MessageContext
  include ApplicationHelper

  context_to_action!

  def start(*)
    # TODO: change this default message
    reply_with :message, text: 'Hi there!'
  end

  def shows(* args)
    endingDate = Date.parse(END_DATE_STRING, t(:date_format))

    # If arguments is not empty, check if it's a number or a string
    if args.any?

      selectedDay, argsTypeErrorMessage = getArgsFromCommand(* args)

      # Return immediately if an error message was caught
      if argsTypeErrorMessage
        replyWithText(argsTypeErrorMessage)
        return
      elsif selectedDay.nil?
        replyWithText(t(:error_invalid_weekday))
        return
      end

      requestedDate = getRequestedDateFormated(selectedDay)

      resultAvailable = checkDateAvailability(endingDate, requestedDate)

      if resultAvailable.is_a? String
        replyWithText(resultAvailable)
        return
      else
        @shows = Show.by_date(requestedDate)

        dateFormated = t(:custom_date_format, :day => requestedDate.strftime("%d"), :month => requestedDate.strftime("%m"))

        if @shows.empty?
          replyWithText(t(:empty_shows_results, :dateFormated => dateFormated))
        else
          responseMessage = getShowsFormated(@shows, dateFormated)

          replyWithText(responseMessage)
        end

      end

    else
      shows(Date.today.strftime("%d"))
    end
  end

  def ajuda(*)
    reply_with :message, text: (t(:help_message) + t(:help_shows_tomorrow) + t(:help_shows_day_num) + t(:help_shows_further) + t(:help_shows_day_str))
  end

  def help(*)
    ajuda
  end
  # v0.6
  context_handler do
    reply_with :message, text: "You wrote: #{payload['text']}"
  end

  def action_missing(action)
    reply_with :message, text: "Can not perform #{action}" if command?
  end

  private
  def getArgsFromCommand(* args)
    #Day informed as a number
    if args[0].match(NUMBER_REGULAR_EXPRESSION)
      dayFromArgs = args[0].to_s.rjust(2, '0')
      errorMessage = validateDayFromMonth(dayFromArgs.to_i)
    elsif args[0].is_a? String
      #Day informed as a string (monday, tuesday...)
      dayFromArgs = getDayFromString(args[0].to_s)
    else
      #Command does not match anything
      errorMessage = MESSAGE_CHECK_USAGE_COMMAND
    end
    return dayFromArgs, errorMessage
  end

  def replyWithText(text)
    reply_with :message, text: text
  end

  def checkDateAvailability (endingDate, requestedDate)
    # If requested date is bigger than the end date
    if Date.today > endingDate
      return t(:ended_message)
    elsif requestedDate > endingDate
    # If current date is bigger than the end date
      return t(:error_after_end_date)
    else
      return true
    end
  end

  def getCurrentMonth(selectedDay)

    currentMonth = Date.today.strftime("%m").to_s.rjust(2, '0')

    # If the current day is bigger than the requested day, get data from next month
    if Date.today.strftime("%d").to_i > selectedDay.to_i
      currentMonth = (Date.today.strftime("%m").to_i + 1).to_s.rjust(2, '0')
    end

    return currentMonth
  end

  def getRequestedDateFormated (selectedDay)
    currentMonth = getCurrentMonth(selectedDay).to_s
    currentYear  = getCurrentYear().to_s

    return Date.parse(selectedDay + "/" + currentMonth + "/" + currentYear, t(:date_format))
  end

  def getCurrentYear
    return Time.now.year.to_s
  end

  def getShowsFormated(shows, dateFormated)
    responseMessage = t(:shows_title_message, :dateFormated => dateFormated)
    shows.each do |show|
      responseMessage += t(:event_title, :eventTitle => show.name)

      eventConfirmed = show.is_confirmed ? t(:confirmed) : t(:not_confirmed)
      responseMessage +=  t(:event_confirmed, :eventConfirmed => eventConfirmed)
      responseMessage +=  t(:event_band_info, :moreInfo => show.link_band)
    end
    responseMessage += "--------------- \n"

    return responseMessage
  end

end