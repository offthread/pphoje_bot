class TelegramWebhooksController < Telegram::Bot::UpdatesController
  include Telegram::Bot::UpdatesController::MessageContext
  include ApplicationHelper

  context_to_action!

  def start(*)
    # TODO: change this default message
    reply_with :message, text: 'Hi there!'
  end

  def shows(*args)
    # If arguments is not empty, check if it's a number or a string
    if args.any?
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

      currentMonth = Date.today.strftime("%m").to_s.rjust(2, '0')

      # If the current day is bigger than the requested day, get data from next month
      if Date.today.strftime("%d").to_i > dayFromArgs.to_i 
        currentMonth = (Date.today.strftime("%m").to_i + 1).to_s.rjust(2, '0')
      end

      if errorMessage.nil?
        @shows = Show.by_day(dayFromArgs, currentMonth)
      else
        reply_with :message, text: errorMessage
        return
      end

      dateFormated = t(:custom_data_format, :day => dayFromArgs, :month => currentMonth)

      if @shows.empty?
        reply_with :message, text: t(:empty_shows_results, :dateFormated => dateFormated)
      else

        response_message = t(:shows_title_message, :dateFormated => dateFormated)

        @shows.each do |show|
          response_message += t(:event_title, :eventTitle => show.name)

          eventConfirmed = show.is_confirmed ? t(:confirmed) : t(:not_confirmed)
          response_message +=  t(:event_confirmed, :eventConfirmed => eventConfirmed)
          response_message +=  t(:event_band_info, :moreInfo => show.link_band)
        end
        response_message += "--------------- \n"
        
        reply_with :message, text: response_message
      end
    else
      reply_with :message, text: MESSAGE_CHECK_USAGE_COMMAND
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
end
